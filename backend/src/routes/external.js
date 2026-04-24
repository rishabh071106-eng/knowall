// Archive.org + NASA importer — legally rehost commercial-use video.
//
// License policy: only accept public-domain and CC-BY (incl. BY-SA).
// Reject -NC, -ND. Empty license is accepted ONLY if the item is in a known
// public-domain collection (NASA, opensource_movies, prelinger, etc.).

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { query } from '../db.js';
import { requireInstructor } from '../middleware/auth.js';
import { ADMIN_UPLOAD_DIR } from './admin.js';

export const externalRouter = Router();

const PD_COLLECTIONS = new Set([
  'opensource_movies', 'prelinger', 'nasa', 'nasa_vault',
  'educationalfilms', 'classic_tv', 'feature_films',
  'additional_collections_movies', 'moving_image',
]);

function licenseOk(licenseurl, collections = []) {
  if (licenseurl) {
    const l = String(licenseurl).toLowerCase();
    if (l.includes('publicdomain')) return true;
    // Accept CC-BY and BY-SA; reject NC and ND.
    if (/creativecommons\.org\/licenses\/by(?:-sa)?\/\d/.test(l)) return true;
    return false;
  }
  // No license field → accept only if in a known public-domain collection.
  const colls = Array.isArray(collections) ? collections : [collections];
  return colls.some((c) => c && PD_COLLECTIONS.has(String(c).toLowerCase()));
}

function licenseLabel(licenseurl) {
  if (!licenseurl) return 'Public domain (collection)';
  const l = String(licenseurl).toLowerCase();
  if (l.includes('publicdomain')) return 'Public domain';
  if (/by-sa/.test(l)) return 'CC-BY-SA';
  if (/by\/\d/.test(l)) return 'CC-BY';
  return 'Unknown';
}

// GET /api/admin/external/search?q=python
externalRouter.get('/search', requireInstructor, async (req, res) => {
  const userQ = String(req.query.q || '').trim();
  if (!userQ) return res.json({ items: [] });

  // Bias results toward commercial-use content.
  const licenseFilter =
    '(licenseurl:*publicdomain* OR licenseurl:*creativecommons.org\\/licenses\\/by\\/* ' +
    'OR licenseurl:*creativecommons.org\\/licenses\\/by-sa\\/* ' +
    'OR collection:(opensource_movies OR prelinger OR nasa OR educationalfilms))';
  const q = `mediatype:movies AND (${licenseFilter}) AND (${userQ})`;

  const params = new URLSearchParams({
    q, rows: '24', page: '1', output: 'json',
  });
  ['identifier', 'title', 'description', 'licenseurl', 'subject', 'collection', 'downloads']
    .forEach((f) => params.append('fl[]', f));

  try {
    const r = await fetch(`https://archive.org/advancedsearch.php?${params}`);
    if (!r.ok) return res.status(502).json({ error: `archive.org ${r.status}` });
    const data = await r.json();

    const items = (data.response?.docs || [])
      .filter((d) => licenseOk(d.licenseurl, d.collection))
      .map((d) => ({
        id: d.identifier,
        title: d.title,
        description: Array.isArray(d.description) ? d.description[0] : d.description,
        license: d.licenseurl || '',
        licenseLabel: licenseLabel(d.licenseurl),
        downloads: d.downloads || 0,
        thumbnailUrl: `https://archive.org/services/img/${d.identifier}`,
        detailsUrl: `https://archive.org/details/${d.identifier}`,
      }));
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Pick the best playable video file from an archive.org item.
// Preference: h.264 MP4 at medium quality → any MP4 → any WebM → any video.
function pickBestFile(files = []) {
  const vids = files.filter((f) =>
    /\.(mp4|webm|mov|ogv|m4v)$/i.test(f.name)
  );
  if (!vids.length) return null;

  const score = (f) => {
    const fmt = String(f.format || '').toLowerCase();
    const name = f.name.toLowerCase();
    let s = 0;
    if (/h\.264|mpeg4|mp4/.test(fmt) || name.endsWith('.mp4')) s += 100;
    if (/512kb/.test(fmt) || /512kb/.test(name)) s += 30; // good tradeoff
    if (/ogg video/.test(fmt)) s -= 20;
    // Prefer under 300 MB for fast import
    const size = Number(f.size || 0);
    if (size && size < 300 * 1024 * 1024) s += 20;
    if (size && size > 1_000 * 1024 * 1024) s -= 30;
    return s;
  };
  vids.sort((a, b) => score(b) - score(a));
  return vids[0];
}

// Download an archive.org item's best video, save locally, create a lesson.
// POST /api/admin/external/import-archive
// Body: { identifier, courseId, title?, isPreview? }
externalRouter.post('/import-archive', requireInstructor, async (req, res) => {
  const { identifier, courseId, title, isPreview, mode } = req.body || {};
  // mode: 'hotlink' (default) stores archive.org URL directly — no storage, no egress cost
  //       'rehost' downloads the file to our uploads dir — only use with persistent disk
  const importMode = mode === 'rehost' ? 'rehost' : 'hotlink';

  if (!identifier || !courseId) return res.status(400).json({ error: 'identifier and courseId required' });

  // Ownership: non-admin instructors can only import into their own courses.
  if (req.user.role !== 'admin') {
    const { rows: own } = await query(
      `SELECT 1 FROM courses WHERE id = $1 AND instructor_id = $2`,
      [courseId, req.user.id]
    );
    if (!own.length) return res.status(403).json({ error: 'not your course' });
  }

  // 1. Fetch item metadata
  const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
  if (!metaRes.ok) return res.status(502).json({ error: 'could not fetch item metadata' });
  const meta = await metaRes.json();
  const itemMeta = meta.metadata || {};

  if (!licenseOk(itemMeta.licenseurl, itemMeta.collection)) {
    return res.status(400).json({
      error: `license not accepted for commercial use: ${itemMeta.licenseurl || 'none'}`,
    });
  }

  const best = pickBestFile(meta.files);
  if (!best) return res.status(400).json({ error: 'no playable video file on this item' });

  const archiveUrl = `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(best.name)}`;
  const lessonTitle = (title || itemMeta.title || identifier).toString().slice(0, 200);
  // Duration may live in best.length as "mm:ss" or seconds
  let duration = 0;
  if (best.length) {
    const parts = String(best.length).split(':').map(Number);
    duration = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2]
              : parts.length === 2 ? parts[0] * 60 + parts[1]
              : Math.round(parts[0]) || 0;
  }

  try {
    let videoKey = archiveUrl;
    let size = 0;

    if (importMode === 'rehost') {
      // Download to local disk (needs persistent storage in production).
      const filename = `archive-${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${best.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filepath = path.join(ADMIN_UPLOAD_DIR, filename);
      try {
        const r = await fetch(archiveUrl);
        if (!r.ok || !r.body) throw new Error(`download failed: ${r.status}`);
        await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(filepath));
        videoKey = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(filename)}`;
        size = fs.statSync(filepath).size;
      } catch (e) {
        try { fs.unlinkSync(filepath); } catch {}
        throw e;
      }
    }

    const { rows: posRows } = await query(
      `SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM lessons WHERE course_id = $1`,
      [courseId]
    );
    const position = posRows[0].pos;

    const { rows } = await query(
      `INSERT INTO lessons (course_id, title, position, duration_seconds, is_preview, video_key)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [courseId, lessonTitle, position, duration, !!isPreview, videoKey]
    );

    res.json({
      ok: true,
      mode: importMode,
      lessonId: rows[0].id,
      title: lessonTitle,
      size,
      license: itemMeta.licenseurl || 'collection-based public domain',
      attribution: itemMeta.creator || itemMeta.uploader || '',
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});
