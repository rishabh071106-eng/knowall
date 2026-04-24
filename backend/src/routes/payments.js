import { Router } from 'express';
import express from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  getRazorpay,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/razorpay.js';
import { config } from '../config.js';

export const paymentsRouter = Router();

// Create a Razorpay order for a given course.
// DEV MODE: if Razorpay is not configured, returns { devMode: true } and the
// frontend calls /payments/dev-complete to simulate a successful purchase.
paymentsRouter.post('/order', requireAuth, async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) return res.status(400).json({ error: 'courseId required' });

  const { rows } = await query(
    `SELECT id, title, price_paise FROM courses WHERE id = $1`,
    [courseId]
  );
  const course = rows[0];
  if (!course) return res.status(404).json({ error: 'course not found' });

  // Already paid?
  const { rows: existing } = await query(
    `SELECT 1 FROM purchases WHERE user_id = $1 AND course_id = $2 AND status = 'paid'`,
    [req.user.id, course.id]
  );
  if (existing.length) return res.status(409).json({ error: 'already purchased' });

  const rzp = getRazorpay();
  if (!rzp) {
    // Dev mode — no real payment gateway configured.
    return res.json({
      devMode: true,
      course: { id: course.id, title: course.title, price_paise: course.price_paise },
    });
  }

  const order = await rzp.orders.create({
    amount: course.price_paise,  // in paise. ₹1 = 100 paise
    currency: 'INR',
    receipt: `c${course.id}-u${req.user.id}-${Date.now()}`,
    notes: { courseId: String(course.id), userId: String(req.user.id) },
  });

  await query(
    `INSERT INTO purchases (user_id, course_id, razorpay_order_id, amount_paise, status)
     VALUES ($1, $2, $3, $4, 'created')
     ON CONFLICT (razorpay_order_id) DO NOTHING`,
    [req.user.id, course.id, order.id, course.price_paise]
  );

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: config.razorpay.keyId,
    course: { id: course.id, title: course.title },
  });
});

// DEV MODE completion — only valid while Razorpay is NOT configured.
// Remove or disable for production.
paymentsRouter.post('/dev-complete', requireAuth, async (req, res) => {
  if (getRazorpay()) return res.status(400).json({ error: 'razorpay is configured, use real flow' });
  const { courseId } = req.body;
  if (!courseId) return res.status(400).json({ error: 'courseId required' });

  const { rows } = await query(
    `SELECT id, price_paise FROM courses WHERE id = $1`, [courseId]
  );
  const course = rows[0];
  if (!course) return res.status(404).json({ error: 'course not found' });

  await query(
    `INSERT INTO purchases (user_id, course_id, amount_paise, status, paid_at, razorpay_order_id)
     VALUES ($1, $2, $3, 'paid', NOW(), $4)
     ON CONFLICT (razorpay_order_id) DO NOTHING`,
    [req.user.id, course.id, course.price_paise, `dev-${req.user.id}-${course.id}-${Date.now()}`]
  );
  res.json({ ok: true, devMode: true });
});

// Client-side verify after checkout.on('payment.success'). Marks purchase paid.
paymentsRouter.post('/verify', requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  })) {
    return res.status(400).json({ error: 'bad signature' });
  }

  await query(
    `UPDATE purchases
       SET status = 'paid',
           razorpay_payment_id = $1,
           paid_at = NOW()
     WHERE razorpay_order_id = $2 AND user_id = $3`,
    [razorpay_payment_id, razorpay_order_id, req.user.id]
  );

  res.json({ ok: true });
});

// Razorpay webhook — the authoritative source of truth.
// Mount with raw body parser (done in index.js).
export async function razorpayWebhookHandler(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const raw = req.body instanceof Buffer ? req.body.toString('utf8') : '';
  if (!verifyWebhookSignature(raw, signature)) return res.status(400).send('bad sig');

  const event = JSON.parse(raw);
  if (event.event === 'payment.captured') {
    const p = event.payload.payment.entity;
    await query(
      `UPDATE purchases
          SET status = 'paid',
              razorpay_payment_id = $1,
              paid_at = NOW()
        WHERE razorpay_order_id = $2`,
      [p.id, p.order_id]
    );
  }
  res.json({ received: true });
}

export const rawBodyParser = express.raw({ type: 'application/json' });
