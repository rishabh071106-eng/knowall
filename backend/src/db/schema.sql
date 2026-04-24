-- Knowall — PostgreSQL schema
-- Run with:  psql $DATABASE_URL -f src/db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id             BIGSERIAL PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  name           TEXT,
  role           TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin','instructor')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id             BIGSERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  description    TEXT DEFAULT '',
  category       TEXT NOT NULL,
  price_paise    INTEGER NOT NULL DEFAULT 1000,  -- ₹10 = 1000 paise
  thumbnail_url  TEXT,
  instructor_id  BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS courses_category_idx ON courses (lower(category));

CREATE TABLE IF NOT EXISTS lessons (
  id                BIGSERIAL PRIMARY KEY,
  course_id         BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  position          INTEGER NOT NULL DEFAULT 0,
  duration_seconds  INTEGER NOT NULL DEFAULT 0,
  is_preview        BOOLEAN NOT NULL DEFAULT FALSE,
  -- S3 object key (or HLS manifest path). NULL until upload completes.
  video_key         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS lessons_course_idx ON lessons (course_id, position);

CREATE TABLE IF NOT EXISTS purchases (
  id                   BIGSERIAL PRIMARY KEY,
  user_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id            BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  razorpay_order_id    TEXT UNIQUE,
  razorpay_payment_id  TEXT,
  amount_paise         INTEGER NOT NULL,
  status               TEXT NOT NULL DEFAULT 'created'
                         CHECK (status IN ('created','paid','failed','refunded')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at              TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS purchases_paid_unique
  ON purchases (user_id, course_id) WHERE status = 'paid';

-- Seed starter categories by inserting one placeholder course per category.
-- Delete these once you've added real courses.
INSERT INTO courses (title, slug, description, category, price_paise)
VALUES
  ('Maths 101 (placeholder)',  'maths-101',  'Replace me', 'Maths',  100),
  ('AI 101 (placeholder)',     'ai-101',     'Replace me', 'AI',     100),
  ('Java 101 (placeholder)',   'java-101',   'Replace me', 'Java',   100),
  ('Python 101 (placeholder)', 'python-101', 'Replace me', 'Python', 1000)
ON CONFLICT (slug) DO NOTHING;
