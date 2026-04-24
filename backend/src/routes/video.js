import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { signCloudFrontUrl } from '../services/s3.js';
import { config } from '../config.js';

export const videoRouter = Router();

// Issue a playable URL for a lesson's video.
//  - If video_key is already an http(s) URL (dev mode / external host), return as-is.
//  - Otherwise sign it through CloudFront (production path).
// Access: purchase required unless lesson.is_preview is true.
videoRouter.get('/:lessonId/url', requireAuth, async (req, res) => {
  const { lessonId } = req.params;

  const { rows } = await query(
    `SELECT l.id, l.video_key, l.is_preview, l.course_id
     FROM lessons l WHERE l.id = $1`,
    [lessonId]
  );
  const lesson = rows[0];
  if (!lesson) return res.status(404).json({ error: 'lesson not found' });
  if (!lesson.video_key) return res.status(409).json({ error: 'video not uploaded yet' });

  if (!lesson.is_preview) {
    // Admins always watch. Instructors watch their own. Others need a paid purchase.
    let allowed = req.user.role === 'admin';
    if (!allowed && req.user.role === 'instructor') {
      const { rows: own } = await query(
        `SELECT 1 FROM courses WHERE id = $1 AND instructor_id = $2`,
        [lesson.course_id, req.user.id]
      );
      allowed = own.length > 0;
    }
    if (!allowed) {
      const { rows: paid } = await query(
        `SELECT 1 FROM purchases
          WHERE user_id = $1 AND course_id = $2 AND status = 'paid'`,
        [req.user.id, lesson.course_id]
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
