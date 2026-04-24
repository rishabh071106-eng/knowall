# Knowall

A Udemy-style learning platform. Each course costs ₹1 (UPI / card / netbanking via Razorpay). Videos are hosted on AWS S3 and streamed through CloudFront signed URLs — playback only, no downloads.

Categories out of the box: Maths, AI, Java, Python. Add more from the admin panel.

## Stack

| Layer        | Tech                                                       |
|--------------|------------------------------------------------------------|
| Frontend     | React 18 + Vite + Tailwind + React Router                  |
| Backend      | Node.js + Express + JWT auth                               |
| Database     | PostgreSQL                                                 |
| Payments     | Razorpay (UPI + cards + netbanking)                        |
| Video host   | AWS S3 (private bucket) + CloudFront signed URLs           |
| Transcoding  | AWS MediaConvert → HLS (recommended for adaptive streaming)|

## Repo layout

```
knowall/
├── backend/         Express API
├── frontend/        React app
├── .env.example     Template — copy to backend/.env
└── README.md
```

## Before you can run it — one-time setup YOU must do

These steps require your identity / money and I cannot do them for you:

### 1. AWS (video hosting)
1. Create an AWS account at https://aws.amazon.com.
2. Create an **S3 bucket**, region e.g. `ap-south-1` (Mumbai). Keep it **private** — block all public access.
3. Create a **CloudFront distribution** with the S3 bucket as origin. Enable **Origin Access Control**.
4. In CloudFront → Key management → create a **public key** and a **key group**. Attach the key group to the distribution behavior and require signed URLs.
5. Download the private key `.pem`. You'll paste its contents into `CLOUDFRONT_PRIVATE_KEY` in `.env`.
6. Create an **IAM user** with programmatic access and policies `AmazonS3FullAccess` (scope down later) + `AWSElementalMediaConvertFullAccess`. Save the access key and secret.

### 2. Razorpay (payments)
1. Sign up at https://razorpay.com (needs PAN + bank account).
2. Dashboard → Settings → API Keys → Generate Test Keys first, live later.
3. Put `key_id` and `key_secret` into `.env`.
4. Enable UPI, cards, and netbanking in Payment Methods.

### 3. PostgreSQL
1. Install locally (`brew install postgresql@16`) or use any managed PG (Neon, Supabase, RDS).
2. Create database: `createdb knowall`.
3. Run schema: `psql knowall < backend/src/db/schema.sql`.

## Run locally

```bash
# backend
cd backend
cp ../.env.example .env        # then fill in real values
npm install
npm run dev                    # http://localhost:4000

# frontend (new terminal)
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

First user to sign up becomes admin automatically (see `backend/src/routes/auth.js`). Log in, go to `/admin`, add courses + upload videos.

## Uploading a course video (admin flow)

1. Admin panel → "New course" → fill title, category, price (default ₹1).
2. Add a lesson → choose a local `.mp4` → backend issues a pre-signed S3 upload URL → browser uploads directly to S3.
3. (Recommended) Trigger MediaConvert to produce an HLS ladder. See `backend/src/services/mediaconvert.js` stub.
4. Students paying ₹1 via Razorpay get a purchase record; the `/api/video/:lessonId/url` endpoint issues a time-limited CloudFront signed URL.

## Why downloads are blocked

- Video served only through time-limited signed URLs (default 2 hours).
- `<video controlsList="nodownload">` + right-click disabled in `VideoPlayer.jsx`.
- HLS segments are small and URLs rotate — screen recording is still possible (no web player can prevent that; DRM like Widevine is the only real fix, out of scope here).

## What's intentionally not in the MVP

- Widevine / FairPlay DRM (requires a paid DRM provider like BuyDRM or EZDRM).
- Instructor revenue share / payouts.
- Certificates, quizzes, discussion forums.
- Mobile apps.

Add these incrementally — the schema already has room for instructors.

## License
Private. You own it.
