# Launching Knowall to the real internet

Goal: a live URL anyone in the world can visit and pay you ₹10 via UPI/card for a course.

**Time needed: ~60 minutes of your hands-on time**, spread across accounts you create. Most of it is waiting for Razorpay email verification.

There are **three things only you can do** (credit cards and KYC are personal). Everything else is already coded.

---

## Step 1 — Razorpay keys (15 min)

This is the only "money" dependency.

### 1a. Test mode (works today, no KYC)

1. Go to https://dashboard.razorpay.com/signup — sign up with your email.
2. Stay in **Test Mode** (top-left toggle must show "Test Mode").
3. Left sidebar → **Account & Settings** → **API Keys** → **Generate Test Key**.
4. A popup shows a **Key Id** (starts `rzp_test_...`) and a **Key Secret** — copy both.

Paste them into this conversation like this:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

I'll set them in the backend .env and restart. You can test real (fake-money) ₹10 purchases with Razorpay's test card immediately:

- Card `4111 1111 1111 1111` · any CVV · any future expiry · OTP `1234`

### 1b. Live mode — when you're ready to take real money

**Requires KYC** (takes 1–3 business days for Razorpay approval):
- PAN card (yours or your business's)
- Bank account (for settlements)
- Business name, address, GST (optional for small-scale)

Once Razorpay activates live mode, generate live keys the same way and drop them into your host's environment variables. No code change.

---

## Step 2 — Deploy the website (20 min)

### Option A — Render.com (recommended, free tier works for day one)

I've written the deployment blueprint already (`render.yaml`). What you do:

1. **Push the code to GitHub.** In Terminal:
   ```bash
   cd /Users/admin/projects/knowall
   git init
   git add -A
   git commit -m "Initial Knowall"
   ```
   Then create a new repo on github.com, and run the two commands GitHub shows you (`git remote add origin…` + `git push -u origin main`).

2. **Deploy on Render.**
   - Go to https://dashboard.render.com/select-repo?type=blueprint
   - Pick your GitHub repo
   - Render reads `render.yaml`, creates a web service + a free Postgres in Mumbai
   - First deploy takes ~4 minutes

3. **Run migrations.** After the service is live:
   - Render dashboard → your service → **Shell** tab
   - Run: `psql $DATABASE_URL -f backend/src/db/schema.sql`
   - Optional (demo data): `psql $DATABASE_URL -f backend/src/db/seed.sql`

4. **Set Razorpay env vars.** Service → **Environment** → add:
   - `RAZORPAY_KEY_ID` = your value
   - `RAZORPAY_KEY_SECRET` = your value
   Hit "Save, rebuild and deploy".

5. **Sign up on your live URL** (`https://knowall.onrender.com` or similar). First signup becomes admin.

**Free-tier caveats:**
- Web service sleeps after 15 min idle — first visit after that cold-starts in ~30s.
- Postgres free instance expires in 90 days — upgrade to the $7/mo plan when you have paying users.

### Option B — Other hosts

The same Docker image runs on:
- **Railway**: one-click deploy, ~$5/mo credit.
- **Fly.io**: `fly launch` — free allowance, has persistent volumes for uploads.
- **DigitalOcean App Platform** / **Heroku** / any Docker host.

Use `render.yaml` as a reference for what env vars to set.

---

## Step 3 — Point a domain at it (20 min, optional but recommended)

Free tier gives you `knowall.onrender.com`. If you want `knowall.in` or similar:

1. Buy a domain at Namecheap, Porkbun, or GoDaddy (₹800–₹2000/year).
2. Render → your service → **Settings → Custom Domains** → add your domain.
3. Render shows you a CNAME record. Go to your domain registrar's DNS and add it.
4. 5–60 minutes later, HTTPS is auto-issued by Render. Done.

---

## What works without AWS

For day-one launch, you can skip AWS entirely if every lesson is either:
- A **YouTube embed** (the URL in `video_key`)
- An **Internet Archive hotlink** (archive.org serves the video; admin → 📼 Internet Archive → leave mode on "Hotlink")

Both cost you nothing in storage or bandwidth.

## When to switch on AWS (S3 + CloudFront)

Add it when you start:
- Uploading your own original lectures (you don't want to lose them on redeploy)
- Getting enough traffic that you want your own CDN

Tell me "set up AWS" when you're ready. It's the only step I can partially automate for you: once you paste me IAM access keys, I run the CLI to create the bucket, distribution, signing keys, bucket policy, and OAC. Zero console clicking for you after the initial account signup.

---

## Razorpay live-mode readiness checklist

Before switching to live keys, double-check the app:

- [ ] Add a **Terms of Service** page (Razorpay requires this for activation — usually `/terms`).
- [ ] Add a **Privacy Policy** page.
- [ ] Add a **Refund policy** page (state your policy clearly — Knowall's default: "Digital course, no refunds after first paid lesson played").
- [ ] Add a **Contact Us** page with a real email.
- [ ] Webhook URL in Razorpay dashboard → `https://yourdomain.com/api/payments/webhook`
   (the signature verification is already implemented; fill `RAZORPAY_WEBHOOK_SECRET` to enable it).

Tell me "add the legal pages" and I'll scaffold them.

---

## What I need from you now

1. Say **"here are the Razorpay keys"** and paste them.
2. Say **"deploy to Render"** → I'll walk through each Render dashboard click with you.

Or say **"do the deploy yourself"** and share a temporary GitHub token + Render API key, and I'll do steps 2.1–2.4 entirely via CLI. (Only do this if you're comfortable with short-lived tokens — revoke after.)
