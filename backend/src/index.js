import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { coursesRouter } from './routes/courses.js';
import {
  paymentsRouter,
  razorpayWebhookHandler,
  rawBodyParser,
} from './routes/payments.js';
import { videoRouter } from './routes/video.js';
import { adminRouter, ADMIN_UPLOAD_DIR } from './routes/admin.js';
import { externalRouter } from './routes/external.js';

const app = express();
const isProd = config.env === 'production';

// Honor X-Forwarded-For behind Render/Railway/etc. so rate-limit sees real IPs.
app.set('trust proxy', 1);

// Security headers. Relax CSP so YouTube iframes + archive.org video still load.
// Helmet — keep core security headers but DISABLE the strict ones that conflict
// with Razorpay's multi-domain checkout flow and React module loading.
// We keep: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.
// We disable: CSP (Razorpay loads from too many domains), COOP (breaks Razorpay popups),
// CORP (can interfere with module scripts), COEP (already off).
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS — comma-separated whitelist in CORS_ORIGIN. In prod behind one origin, not needed.
const allowed = new Set((config.corsOrigin || '').split(',').map(s => s.trim()).filter(Boolean));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.size === 0 || allowed.has(origin)) return cb(null, true);
    cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true,
}));

// Webhook needs the raw body for signature verification — mount BEFORE json parser.
app.post('/api/payments/webhook', rawBodyParser, razorpayWebhookHandler);

app.use(express.json({ limit: '1mb' }));

// Rate limits — aggressive on auth, looser on read APIs.
const authLimiter   = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30,  standardHeaders: true, legacyHeaders: false });
const apiLimiter    = rateLimit({ windowMs:  1 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });

app.get('/api/health', (_req, res) => res.json({ ok: true, env: config.env }));

// Uploaded videos (dev or persistent-disk mode)
app.use('/uploads', express.static(ADMIN_UPLOAD_DIR, {
  setHeaders: (res) => { res.setHeader('Cache-Control', 'private, max-age=3600'); },
}));

app.use('/api/auth',    authLimiter, authRouter);
app.use('/api/courses', apiLimiter,  coursesRouter);
app.use('/api/payments',             paymentsRouter);  // has its own verify, don't double-rate-limit
app.use('/api/video',   apiLimiter,  videoRouter);
app.use('/api/admin',   apiLimiter,  adminRouter);
app.use('/api/admin/external',       externalRouter);

// ---- Production: serve built frontend from /public ----
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, '..', 'public');
if (isProd && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { index: false, maxAge: '1h' }));
  // SPA fallback — everything not starting with /api or /uploads gets index.html
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error catcher
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: isProd ? 'internal error' : String(err.message || err) });
});

app.listen(config.port, () => {
  console.log(`Knowall ${isProd ? 'prod' : 'dev'} server listening on http://localhost:${config.port}`);
});
