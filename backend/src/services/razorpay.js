import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { config } from '../config.js';

let client = null;
export function getRazorpay() {
  if (!config.razorpay.keyId) return null;
  if (!client) {
    client = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return client;
}

// Verify signature returned by Razorpay checkout (client-side callback).
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

// Verify a webhook body signature (set RAZORPAY_WEBHOOK_SECRET in Razorpay dashboard).
export function verifyWebhookSignature(rawBody, signature) {
  if (!config.razorpay.webhookSecret) return false;
  const expected = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}
