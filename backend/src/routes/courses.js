import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const coursesRouter = Router();

// Public: list all courses, optional ?category=python
coursesRouter.get('/', async (req, res) => {
  const { category } = req.query;
  const params = [];
  let where = '';
  if (category) {
    params.push(String(category).toLowerCase());
    where = `WHERE lower(c.category) = $1`;
  }
  const { rows } = await query(
    `SELECT c.id, c.title, c.slug, c.description, c.category, c.price_paise,
            c.thumbnail_url, c.created_at,
            COALESCE(l.lesson_count, 0) AS lesson_count
     FROM courses c
     LEFT JOIN (
       SELECT course_id, COUNT(*)::int AS lesson_count FROM lessons GROUP BY course_id
     ) l ON l.course_id = c.id
     ${where}
     ORDER BY c.created_at DESC`,
    params
  );
  res.json({ courses: rows });
});

// Public: distinct categories
coursesRouter.get('/categories', async (_req, res) => {
  const { rows } = await query(
    `SELECT category, COUNT(*)::int AS count
     FROM courses GROUP BY category ORDER BY category`
  );
  res.json({ categories: rows });
});

// Public: course detail + lessons (lesson video keys are NOT returned here)
coursesRouter.get('/:slug', async (req, res) => {
  const { rows: courses } = await query(
    `SELECT id, title, slug, description, category, price_paise, thumbnail_url
     FROM courses WHERE slug = $1`,
    [req.params.slug]
  );
  const course = courses[0];
  if (!course) return res.status(404).json({ error: 'not found' });

  const { rows: lessons } = await query(
    `SELECT id, title, position, duration_seconds, is_preview
     FROM lessons WHERE course_id = $1 ORDER BY position ASC`,
    [course.id]
  );

  let purchased = false;
  const auth = req.headers.authorization;
  if (auth) {
    try {
      const jwt = (await import('jsonwebtoken')).default;
      const { config } = await import('../config.js');
      const u = jwt.verify(auth.slice(7), config.jwtSecret);
      const { rows } = await query(
        `SELECT 1 FROM purchases WHERE user_id = $1 AND course_id = $2 AND status = 'paid'`,
        [u.id, course.id]
      );
      purchased = rows.length > 0;
    } catch { /* not logged in — fine */ }
  }

  res.json({ course, lessons, purchased });
});

// Student: my purchased courses
coursesRouter.get('/mine/list', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT c.id, c.title, c.slug, c.category, c.thumbnail_url
     FROM purchases p
     JOIN courses c ON c.id = p.course_id
     WHERE p.user_id = $1 AND p.status = 'paid'
     ORDER BY p.paid_at DESC`,
    [req.user.id]
  );
  res.json({ courses: rows });
});
