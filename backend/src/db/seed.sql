-- Knowall demo seed data
-- Run with:  psql $DATABASE_URL -f src/db/seed.sql
--
-- Replace the placeholder videos (Blender Foundation open films + Google sample
-- videos — all public domain / CC-BY) with your real lectures via the admin panel.
-- The video URLs below are STABLE public URLs so the player works immediately.

BEGIN;

-- Wipe existing demo data. Safe for a dev DB. Don't run on prod.
TRUNCATE TABLE lessons       RESTART IDENTITY CASCADE;
TRUNCATE TABLE purchases     RESTART IDENTITY CASCADE;
TRUNCATE TABLE courses       RESTART IDENTITY CASCADE;

-- ============================================================
-- Courses
-- ============================================================
INSERT INTO courses (id, title, slug, description, category, price_paise, thumbnail_url) VALUES
-- Maths
(1, 'Calculus Crash Course',
   'calculus-crash-course',
   'Limits, derivatives, integrals — the whole machine of calculus, built from first principles in under 3 hours.',
   'Maths', 1000,
   'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=640&auto=format&fit=crop'),
(2, 'Linear Algebra for Engineers',
   'linear-algebra-for-engineers',
   'Vectors, matrices, eigenvalues, and why every ML model is secretly just linear algebra in a trenchcoat.',
   'Maths', 1000,
   'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=640&auto=format&fit=crop'),

-- AI
(3, 'Neural Networks from Scratch',
   'neural-networks-from-scratch',
   'Forward pass, backprop, gradient descent — build your first neural net in NumPy without any framework magic.',
   'AI', 1000,
   'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=640&auto=format&fit=crop'),
(4, 'Prompt Engineering for Builders',
   'prompt-engineering-for-builders',
   'System prompts, few-shot, structured output, tool use. Practical LLM wrangling for people shipping real products.',
   'AI', 1000,
   'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=640&auto=format&fit=crop'),

-- Java
(5, 'Modern Java: From Zero to Spring Boot',
   'modern-java-zero-to-spring-boot',
   'Java 21 features, records, virtual threads, and a real REST API built with Spring Boot by the end of day one.',
   'Java', 1000,
   'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640&auto=format&fit=crop'),
(6, 'Data Structures in Java',
   'data-structures-in-java',
   'Arrays, lists, hashmaps, trees, graphs — implement them, benchmark them, and actually understand Big-O.',
   'Java', 1000,
   'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&auto=format&fit=crop'),

-- Python
(7, 'Python for Absolute Beginners',
   'python-for-absolute-beginners',
   'Variables, loops, functions, files, APIs. If you''ve never written a line of code, start here.',
   'Python', 1000,
   'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=640&auto=format&fit=crop'),
(8, 'Python for Data Analysis',
   'python-for-data-analysis',
   'pandas, NumPy, matplotlib. Take a messy CSV and turn it into an insight-packed chart in one evening.',
   'Python', 1000,
   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&auto=format&fit=crop'),

-- Web Development
(9, 'Full-Stack Web Development',
   'full-stack-web-dev',
   'HTML, CSS, React, Node, Postgres. Ship a real full-stack app you can show an employer by the end of the course.',
   'Web Development', 1000,
   'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&auto=format&fit=crop'),
(10, 'Tailwind CSS Mastery',
    'tailwind-css-mastery',
    'Utility-first styling, responsive layouts, dark mode, design tokens — opinionated and fast.',
    'Web Development', 1000,
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=640&auto=format&fit=crop'),

-- Design
(11, 'UI/UX Design Fundamentals',
    'ui-ux-fundamentals',
    'Hierarchy, spacing, type, color, states. Steal these principles and your apps will stop looking amateur.',
    'Design', 1000,
    'https://images.unsplash.com/photo-1561070791-2526d30994b8?w=640&auto=format&fit=crop'),

-- Productivity
(12, 'Deep Work & Focus',
    'deep-work-and-focus',
    'The science of attention and concrete routines for doing hard intellectual work without burning out.',
    'Productivity', 1000,
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=640&auto=format&fit=crop'),

-- Business
(13, 'Indie Hacking: Build & Launch',
    'indie-hacking-build-launch',
    'Pick an idea, ship an MVP, get paying users. Zero fluff, just the steps that actually work.',
    'Business', 1000,
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=640&auto=format&fit=crop'),
(14, 'Personal Finance for Techies',
    'personal-finance-for-techies',
    'Budgeting, investing, taxes (India-focused), and why compounding is the eighth wonder of the world.',
    'Business', 1000,
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&auto=format&fit=crop');

SELECT setval(pg_get_serial_sequence('courses','id'),
              (SELECT MAX(id) FROM courses));

-- ============================================================
-- Lessons — each course gets a free preview as lesson 1 so
-- anyone can test the video player without buying.
-- ============================================================

-- Four public-domain / CC-BY sample videos we rotate through.
-- In production you'll replace these with S3 keys; for now they're full URLs,
-- which the /api/video endpoint returns as-is (dev mode).
--   bbb = Big Buck Bunny          (Blender, CC-BY)
--   sintel = Sintel                (Blender, CC-BY)
--   tos = Tears of Steel           (Blender, CC-BY)
--   ed = Elephants Dream           (Blender, CC-BY)

-- Helpful trick: a temporary function to add a lesson succinctly.
CREATE OR REPLACE FUNCTION _add_lesson(
  p_course BIGINT, p_pos INT, p_title TEXT, p_dur INT, p_preview BOOL, p_vid TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO lessons (course_id, position, title, duration_seconds, is_preview, video_key)
  VALUES (p_course, p_pos, p_title, p_dur, p_preview, p_vid);
END;
$$ LANGUAGE plpgsql;

-- Video URL shortcuts
-- (Blender Foundation hosts these; Google also mirrors them.)
\set bbb    '''https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'''
\set sintel '''https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'''
\set tos    '''https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'''
\set ed     '''https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'''

-- Calculus
SELECT _add_lesson(1, 0, 'What is a limit? (Free preview)', 596, true,  :bbb);
SELECT _add_lesson(1, 1, 'Derivatives from first principles', 720, false, :sintel);
SELECT _add_lesson(1, 2, 'The chain rule',                    540, false, :tos);
SELECT _add_lesson(1, 3, 'Integrals and the fundamental theorem', 900, false, :ed);

-- Linear Algebra
SELECT _add_lesson(2, 0, 'Vectors — the intuitive picture (Free preview)', 420, true, :sintel);
SELECT _add_lesson(2, 1, 'Matrices as transformations', 660, false, :bbb);
SELECT _add_lesson(2, 2, 'Eigenvalues & eigenvectors',  780, false, :tos);

-- Neural Networks
SELECT _add_lesson(3, 0, 'Why neural networks work (Free preview)', 510, true, :tos);
SELECT _add_lesson(3, 1, 'Forward propagation in NumPy', 900, false, :bbb);
SELECT _add_lesson(3, 2, 'Backprop demystified',         1020, false, :sintel);
SELECT _add_lesson(3, 3, 'Training your first net',      840, false, :ed);

-- Prompt Engineering
SELECT _add_lesson(4, 0, 'What makes a good prompt (Free preview)', 360, true, :ed);
SELECT _add_lesson(4, 1, 'System prompts & roles', 540, false, :bbb);
SELECT _add_lesson(4, 2, 'Structured outputs (JSON, tool use)', 720, false, :tos);
SELECT _add_lesson(4, 3, 'Evaluating prompt quality', 600, false, :sintel);

-- Modern Java
SELECT _add_lesson(5, 0, 'Your first Java program (Free preview)', 300, true, :bbb);
SELECT _add_lesson(5, 1, 'Records, sealed classes, pattern matching', 840, false, :sintel);
SELECT _add_lesson(5, 2, 'Virtual threads in Java 21', 660, false, :tos);
SELECT _add_lesson(5, 3, 'Building a REST API with Spring Boot', 1200, false, :ed);

-- Data Structures in Java
SELECT _add_lesson(6, 0, 'Big-O in 7 minutes (Free preview)', 420, true, :sintel);
SELECT _add_lesson(6, 1, 'Arrays and ArrayLists', 540, false, :bbb);
SELECT _add_lesson(6, 2, 'HashMaps from scratch',   780, false, :tos);
SELECT _add_lesson(6, 3, 'Trees and graphs',        960, false, :ed);

-- Python Beginners
SELECT _add_lesson(7, 0, 'Installing Python (Free preview)', 240, true, :bbb);
SELECT _add_lesson(7, 1, 'Variables, types, strings', 480, false, :sintel);
SELECT _add_lesson(7, 2, 'Loops and conditionals',    540, false, :tos);
SELECT _add_lesson(7, 3, 'Functions, modules, files', 660, false, :ed);
SELECT _add_lesson(7, 4, 'Calling your first API',    540, false, :bbb);

-- Python Data Analysis
SELECT _add_lesson(8, 0, 'Why pandas? (Free preview)', 360, true, :tos);
SELECT _add_lesson(8, 1, 'DataFrames, Series, indexing', 780, false, :bbb);
SELECT _add_lesson(8, 2, 'Cleaning messy data',          900, false, :sintel);
SELECT _add_lesson(8, 3, 'Visualising with matplotlib',  720, false, :ed);

-- Full-Stack Web
SELECT _add_lesson(9, 0, 'The modern web stack (Free preview)', 480, true, :ed);
SELECT _add_lesson(9, 1, 'HTML, CSS, and the box model', 660, false, :bbb);
SELECT _add_lesson(9, 2, 'React components and state',   900, false, :sintel);
SELECT _add_lesson(9, 3, 'Node, Express, and Postgres',  1080, false, :tos);
SELECT _add_lesson(9, 4, 'Deploying to the internet',    720, false, :ed);

-- Tailwind
SELECT _add_lesson(10, 0, 'Why utility-first? (Free preview)', 300, true, :bbb);
SELECT _add_lesson(10, 1, 'Layout with flex and grid',         600, false, :sintel);
SELECT _add_lesson(10, 2, 'Responsive design made easy',       540, false, :tos);
SELECT _add_lesson(10, 3, 'Dark mode and design tokens',       480, false, :ed);

-- UI/UX
SELECT _add_lesson(11, 0, 'The 5 rules of great UI (Free preview)', 420, true, :sintel);
SELECT _add_lesson(11, 1, 'Visual hierarchy',                     540, false, :bbb);
SELECT _add_lesson(11, 2, 'Type, spacing, and color systems',     720, false, :tos);
SELECT _add_lesson(11, 3, 'Designing empty and error states',     600, false, :ed);

-- Deep Work
SELECT _add_lesson(12, 0, 'What deep work actually is (Free preview)', 360, true, :tos);
SELECT _add_lesson(12, 1, 'Designing your focus routine',            660, false, :bbb);
SELECT _add_lesson(12, 2, 'Managing email and notifications',        420, false, :sintel);

-- Indie Hacking
SELECT _add_lesson(13, 0, 'Finding an idea worth building (Free preview)', 540, true, :ed);
SELECT _add_lesson(13, 1, 'Scoping an MVP in 2 weeks',                   720, false, :bbb);
SELECT _add_lesson(13, 2, 'Pricing your product',                        600, false, :sintel);
SELECT _add_lesson(13, 3, 'Launching and getting first 10 customers',    840, false, :tos);

-- Personal Finance
SELECT _add_lesson(14, 0, 'The three-bucket budget (Free preview)', 420, true, :bbb);
SELECT _add_lesson(14, 1, 'Index funds, ELSS, and NPS',           780, false, :sintel);
SELECT _add_lesson(14, 2, 'Taxes for salaried Indians',           660, false, :tos);
SELECT _add_lesson(14, 3, 'Compounding: the only shortcut',       480, false, :ed);

DROP FUNCTION _add_lesson(BIGINT,INT,TEXT,INT,BOOL,TEXT);

COMMIT;

-- Final check
SELECT
  c.category,
  COUNT(DISTINCT c.id) AS courses,
  COUNT(l.id)          AS lessons
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
GROUP BY c.category
ORDER BY c.category;
