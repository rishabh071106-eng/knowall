import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db.js';
import { signToken, requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(80).optional(),
  instructor: z.boolean().optional(),
});

authRouter.post('/signup', async (req, res) => {
  const parsed = credsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, name, instructor } = parsed.data;

  const hash = await bcrypt.hash(password, 10);
  try {
    // First ever user becomes admin. Simple bootstrap; harden for prod.
    const { rows: countRows } = await query('SELECT COUNT(*)::int AS c FROM users');
    const role = countRows[0].c === 0 ? 'admin'
               : instructor              ? 'instructor'
               :                           'student';

    const { rows } = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role`,
      [email.toLowerCase(), hash, name || null, role]
    );
    const user = rows[0];
    res.json({ user, token: signToken(user) });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'email already registered' });
    console.error(e);
    res.status(500).json({ error: 'signup failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = credsSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const { rows } = await query(
    `SELECT id, email, name, role, password_hash FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  delete user.password_hash;
  res.json({ user, token: signToken(user) });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT id, email, name, role FROM users WHERE id = $1`,
    [req.user.id]
  );
  res.json({ user: rows[0] || null });
});
