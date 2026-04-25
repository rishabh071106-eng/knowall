import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { signCloudFrontUrl } from '../services/s3.js';
import { config } from '../config.js';

export const videoRouter = Router();

// Optional-auth: parses the JWT if present, but does NOT 401 if missing.
// Free preview lessons should be watchable without an account.
function parseUserIfPresent(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, config.jwtSecret); }
  catch { return null; }
}

// Issue a playable URL for a lesson's video.
//  - If video_key is already an http(s) URL (dev mode / external host), return as-is.
//  - Otherwise sign it through CloudFront (production path).
// Access policy:
//   - is_preview = true → no auth required, anyone can watch
//   - is_preview = false → requires login + (admin OR instructor-owner OR paid purchase)
videoRouter.get('/:lessonId/url', async (req, res) => {
  const { lessonId } = req.params;

  const { rows } = await query(
    `SELECT l.id, l.video_key, l.is_preview, l.course_id
     FROM lessons l WHERE l.id = $1`,
    [lessonId]
  );
  const lesson = rows[0];
  if (!lesson) return res.status(404).json({ error: 'lesson not found' });
  if (!lesson.video_key) return res.status(409).json({ error: 'video not uploaded yet' });

  // For non-preview lessons, enforce auth + ownership/purchase.
  if (!lesson.is_preview) {
    const user = parseUserIfPresent(req);
    if (!user) return res.status(401).json({ error: 'sign in to watch this lesson' });

    let allowed = user.role === 'admin';
    if (!allowed && user.role === 'instructor') {
      const { rows: own } = await query(
        `SELECT 1 FROM courses WHERE id = $1 AND instructor_id = $2`,
        [lesson.course_id, user.id]
      );
      allowed = own.length > 0;
    }
    if (!allowed) {
      const { rows: paid } = await query(
        `SELECT 1 FROM purchases
          WHERE user_id = $1 AND course_id = $2 AND status = 'paid'`,
        [user.id, lesson.course_id]
      );
      if (!paid.length) return res.status(402).json({ error: 'purchase required' });
    }
  }

  // Dev mode: full URL stored directly.
  if (/^https?:\/\//i.test(lesson.video_key)) {
    return res.json({ url: lesson.video_key, expiresIn: null, mode: 'direct' });
  }

  // Prod mode: sign through CloudFront.
  if (!config.cloudfront.domain || !config.cloudfront.privateKey) {
    return res.status(500).json({
      error: 'CloudFront is not configured. Set CLOUDFRONT_* in .env, or store a full URL in lessons.video_key for dev mode.',
    });
  }
  try {
    const url = signCloudFrontUrl(lesson.video_key);
    res.json({ url, expiresIn: 2 * 60 * 60, mode: 'cloudfront' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'signing failed — check CloudFront config' });
  }
});
