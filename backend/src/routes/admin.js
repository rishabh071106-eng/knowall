import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { query } from '../db.js';
import { requireAdmin, requireInstructor } from '../middleware/auth.js';
import { presignUpload } from '../services/s3.js';
import { config } from '../config.js';

export const adminRouter = Router();

// Helper: is user an admin?
const isAdmin = (u) => u?.role === 'admin';

// Helper: check if the given courseId is owned by the user (or user is admin).
async function canManageCourse(user, courseId) {
  if (isAdmin(user)) return true;
  const { rows } = await query(
    `SELECT 1 FROM courses WHERE id = $1 AND instructor_id = $2`,
    [courseId, user.id]
  );
  return rows.length > 0;
}

// Helper: check if the given lessonId belongs to a course the user can manage.
async function canManageLesson(user, lessonId) {
  if (isAdmin(user)) return true;
  const { rows } = await query(
    `SELECT 1 FROM lessons l
     JOIN courses c ON c.id = l.course_id
     WHERE l.id = $1 AND c.instructor_id = $2`,
    [lessonId, user.id]
  );
  return rows.length > 0;
}

// Dev-mode local upload storage — used when AWS isn't configured.
const UPLOAD_DIR = path.resolve('uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const id = crypto.randomBytes(8).toString('hex');
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${id}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB
});

export const ADMIN_UPLOAD_DIR = UPLOAD_DIR;

const courseSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'lowercase-kebab-only'),
  description: z.string().max(5000).optional(),
  category: z.string().min(1).max(80),
  pricePaise: z.number().int().nonnegative().default(1000), // ₹10 = 1000 paise
  thumbnailUrl: z.string().url().optional(),
});

adminRouter.post('/courses', requireInstructor, async (req, res) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const c = parsed.data;
  try {
    const { rows } = await query(
      `INSERT INTO courses (title, slug, description, category, price_paise, thumbnail_url, instructor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [c.title, c.slug, c.description || '', c.category, c.pricePaise, c.thumbnailUrl || null, req.user.id]
    );
    res.json({ course: rows[0] });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'slug already exists' });
    console.error(e);
    res.status(500).json({ error: 'create failed' });
  }
});

const lessonSchema = z.object({
  courseId: z.number().int().positive(),
  title: z.string().min(2).max(200),
  position: z.number().int().nonnegative().default(0),
  durationSeconds: z.number().int().nonnegative().default(0),
  isPreview: z.boolean().default(false),
});

adminRouter.post('/lessons', requireInstructor, async (req, res) => {
  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const l = parsed.data;
  if (!(await canManageCourse(req.user, l.courseId))) return res.status(403).json({ error: 'not your course' });

  const { rows } = await query(
    `INSERT INTO lessons (course_id, title, position, duration_seconds, is_preview)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [l.courseId, l.title, l.position, l.durationSeconds, l.isPreview]
  );
  res.json({ lesson: rows[0] });
});

// Report which upload backend is active (so the UI can choose its flow).
adminRouter.get('/upload-mode', requireInstructor, (_req, res) => {
  const mode = config.aws.accessKeyId && config.aws.s3Bucket ? 's3' : 'local';
  res.json({ mode });
});

// S3 mode: give the browser a presigned PUT URL.
adminRouter.post('/upload-url', requireInstructor, async (req, res) => {
  const { lessonId, filename, contentType } = req.body;
  if (!filename) return res.status(400).json({ error: 'filename required' });

  const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${config.aws.s3UploadPrefix}${lessonId || 'unassigned'}/${Date.now()}-${safe}`;

  try {
    const url = await presignUpload({ key, contentType: contentType || 'video/mp4' });
    res.json({ uploadUrl: url, key });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'presign failed — check AWS credentials' });
  }
});

// LOCAL-mode upload: browser POSTs multipart; we save to disk + return the URL.
adminRouter.post('/local-upload', requireInstructor, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file field required' });
  // Public URL served by express.static at /uploads
  const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`;
  res.json({ key: publicUrl, filename: req.file.filename, size: req.file.size });
});

// Batch-create lessons (used by multi-file uploader).
// Body: { courseId, lessons: [{ title, position, durationSeconds, isPreview, videoKey }] }
adminRouter.post('/lessons/batch', requireInstructor, async (req, res) => {
  const { courseId, lessons } = req.body;
  if (!courseId || !Array.isArray(lessons) || lessons.length === 0) {
    return res.status(400).json({ error: 'courseId and lessons[] required' });
  }
  if (!(await canManageCourse(req.user, courseId))) return res.status(403).json({ error: 'not your course' });
  const inserted = [];
  for (const l of lessons) {
    if (!l.title || !l.videoKey) continue;
    const { rows } = await query(
      `INSERT INTO lessons (course_id, title, position, duration_seconds, is_preview, video_key)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [courseId, l.title, Number(l.position) || 0, Number(l.durationSeconds) || 0, !!l.isPreview, l.videoKey]
    );
    inserted.push(rows[0].id);
  }
  res.json({ inserted: inserted.length, ids: inserted });
});

// ===== Admin CRUD =====

// List courses — admin sees all, instructor sees only their own
adminRouter.get('/courses', requireInstructor, async (req, res) => {
  const where = isAdmin(req.user) ? '' : 'WHERE c.instructor_id = $1';
  const params = isAdmin(req.user) ? [] : [req.user.id];
  const { rows } = await query(
    `SELECT c.id, c.title, c.slug, c.category, c.price_paise, c.thumbnail_url, c.created_at,
            c.instructor_id,
            COALESCE(l.lesson_count, 0) AS lesson_count,
            COALESCE(l.missing_video, 0) AS missing_video
     FROM courses c
     LEFT JOIN (
       SELECT course_id,
              COUNT(*)::int AS lesson_count,
              SUM(CASE WHEN video_key IS NULL THEN 1 ELSE 0 END)::int AS missing_video
       FROM lessons GROUP BY course_id
     ) l ON l.course_id = c.id
     ${where}
     ORDER BY c.created_at DESC`,
    params
  );
  res.json({ courses: rows });
});

// Admin-view single course with its lessons (includes video_key)
adminRouter.get('/courses/:id', requireInstructor, async (req, res) => {
  if (!(await canManageCourse(req.user, req.params.id))) return res.status(403).json({ error: 'not your course' });
  const { rows: cs } = await query(`SELECT * FROM courses WHERE id = $1`, [req.params.id]);
  if (!cs[0]) return res.status(404).json({ error: 'not found' });
  const { rows: lessons } = await query(
    `SELECT * FROM lessons WHERE course_id = $1 ORDER BY position ASC, id ASC`,
    [req.params.id]
  );
  res.json({ course: cs[0], lessons });
});

adminRouter.patch('/courses/:id', requireInstructor, async (req, res) => {
  if (!(await canManageCourse(req.user, req.params.id))) return res.status(403).json({ error: 'not your course' });
  const fields = ['title', 'slug', 'description', 'category', 'thumbnail_url'];
  const sets = [], vals = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { sets.push(`${f} = $${sets.length + 1}`); vals.push(req.body[f]); }
  }
  if (req.body.pricePaise !== undefined) {
    sets.push(`price_paise = $${sets.length + 1}`); vals.push(Number(req.body.pricePaise));
  }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  const { rows } = await query(
    `UPDATE courses SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals
  );
  res.json({ course: rows[0] });
});

adminRouter.delete('/courses/:id', requireInstructor, async (req, res) => {
  if (!(await canManageCourse(req.user, req.params.id))) return res.status(403).json({ error: 'not your course' });
  await query(`DELETE FROM courses WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

adminRouter.patch('/lessons/:id', requireInstructor, async (req, res) => {
  if (!(await canManageLesson(req.user, req.params.id))) return res.status(403).json({ error: 'not your lesson' });
  const map = {
    title: 'title', position: 'position',
    durationSeconds: 'duration_seconds', isPreview: 'is_preview', videoKey: 'video_key',
  };
  const sets = [], vals = [];
  for (const [k, col] of Object.entries(map)) {
    if (req.body[k] !== undefined) { sets.push(`${col} = $${sets.length + 1}`); vals.push(req.body[k]); }
  }
  if (!sets.length) return res.json({ ok: true });
  vals.push(req.params.id);
  const { rows } = await query(
    `UPDATE lessons SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals
  );
  res.json({ lesson: rows[0] });
});

adminRouter.delete('/lessons/:id', requireInstructor, async (req, res) => {
  if (!(await canManageLesson(req.user, req.params.id))) return res.status(403).json({ error: 'not your lesson' });
  await query(`DELETE FROM lessons WHERE id = $1`, [req.params.id]);
  res.json({ ok: true });
});

// Reorder lessons: body = { orderedIds: [id, id, ...] }
adminRouter.post('/courses/:id/reorder', requireInstructor, async (req, res) => {
  if (!(await canManageCourse(req.user, req.params.id))) return res.status(403).json({ error: 'not your course' });
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds[] required' });
  for (let i = 0; i < orderedIds.length; i++) {
    await query(
      `UPDATE lessons SET position = $1 WHERE id = $2 AND course_id = $3`,
      [i, orderedIds[i], req.params.id]
    );
  }
  res.json({ ok: true });
});

// Bulk import lessons from CSV/TSV.
// Body: { csv: "<raw text>" }
// Accepts CSV or TSV. Header row required. Columns (any order):
//   course_slug, title, video_url, position?, duration_seconds?, is_preview?
// Also supports `course_id` instead of `course_slug`.
// Video URL can be a YouTube URL, an S3 key, or any direct http(s) URL.
adminRouter.post('/bulk-import', requireAdmin, async (req, res) => {
  const { csv } = req.body;
  if (!csv || typeof csv !== 'string') return res.status(400).json({ error: 'csv (string) required' });

  // Auto-detect delimiter
  const firstLine = csv.split(/\r?\n/)[0] || '';
  const delim = firstLine.includes('\t') ? '\t' : ',';

  const parse = (txt) => {
    const rows = [];
    let cur = [], field = '', inQ = false;
    for (let i = 0; i < txt.length; i++) {
      const c = txt[i];
      if (inQ) {
        if (c === '"' && txt[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') inQ = false;
        else field += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === delim) { cur.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
          if (c === '\r' && txt[i + 1] === '\n') i++;
          cur.push(field); field = '';
          if (cur.some(v => v !== '')) rows.push(cur);
          cur = [];
        } else field += c;
      }
    }
    if (field !== '' || cur.length) { cur.push(field); if (cur.some(v => v !== '')) rows.push(cur); }
    return rows;
  };

  const rows = parse(csv.trim());
  if (rows.length < 2) return res.status(400).json({ error: 'need a header row plus at least one data row' });

  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = (name) => header.indexOf(name);

  const iCourseSlug   = col('course_slug');
  const iCourseId     = col('course_id');
  const iTitle        = col('title');
  const iUrl          = col('video_url');
  const iPos          = col('position');
  const iDur          = col('duration_seconds');
  const iPrev         = col('is_preview');

  if (iTitle < 0 || iUrl < 0 || (iCourseSlug < 0 && iCourseId < 0)) {
    return res.status(400).json({
      error: 'csv must have columns: title, video_url, and course_slug (or course_id)',
      headerFound: header,
    });
  }

  // Preload course slug -> id mapping
  const { rows: allCourses } = await query(`SELECT id, slug FROM courses`);
  const slugToId = new Map(allCourses.map(c => [c.slug.toLowerCase(), c.id]));

  const inserted = [];
  const errors = [];
  let pos = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    try {
      const title = (row[iTitle] || '').trim();
      const videoUrl = (row[iUrl] || '').trim();
      if (!title || !videoUrl) { errors.push({ row: r + 1, error: 'missing title or video_url' }); continue; }

      let courseId;
      if (iCourseId >= 0 && row[iCourseId]) courseId = Number(row[iCourseId]);
      else {
        const slug = (row[iCourseSlug] || '').trim().toLowerCase();
        courseId = slugToId.get(slug);
        if (!courseId) { errors.push({ row: r + 1, error: `unknown course slug: ${slug}` }); continue; }
      }

      const position = iPos >= 0 && row[iPos] !== '' ? Number(row[iPos]) : pos++;
      const duration = iDur >= 0 && row[iDur] !== '' ? Number(row[iDur]) : 0;
      const preview  = iPrev >= 0 ? ['1','true','yes','y'].includes(String(row[iPrev]).trim().toLowerCase()) : false;

      const { rows: ins } = await query(
        `INSERT INTO lessons (course_id, title, position, duration_seconds, is_preview, video_key)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [courseId, title, position, duration, preview, videoUrl]
      );
      inserted.push(ins[0].id);
    } catch (e) {
      errors.push({ row: r + 1, error: e.message });
    }
  }

  res.json({ inserted: inserted.length, errors, insertedIds: inserted });
});

// Once the upload completes, the admin UI tells us what key to associate.
adminRouter.post('/lessons/:id/video-key', requireInstructor, async (req, res) => {
  if (!(await canManageLesson(req.user, req.params.id))) return res.status(403).json({ error: 'not your lesson' });
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  await query(`UPDATE lessons SET video_key = $1 WHERE id = $2`, [key, req.params.id]);
  res.json({ ok: true });
});
