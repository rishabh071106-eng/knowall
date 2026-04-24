import 'dotenv/config';
import fs from 'node:fs';

function required(key) {
  const v = process.env[key];
  if (!v) console.warn(`[config] ${key} is not set — related features will be disabled`);
  return v || '';
}

function loadPrivateKey() {
  if (process.env.CLOUDFRONT_PRIVATE_KEY) {
    return process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  if (process.env.CLOUDFRONT_PRIVATE_KEY_PATH) {
    try {
      return fs.readFileSync(process.env.CLOUDFRONT_PRIVATE_KEY_PATH, 'utf8');
    } catch (e) {
      console.warn('[config] could not read CLOUDFRONT_PRIVATE_KEY_PATH:', e.message);
    }
  }
  return '';
}

export const config = {
  port: Number(process.env.PORT || 4000),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: required('JWT_SECRET') || 'dev-only-unsafe-secret',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  databaseUrl: required('DATABASE_URL'),

  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.S3_BUCKET || '',
    s3UploadPrefix: process.env.S3_UPLOAD_PREFIX || 'uploads/',
  },

  cloudfront: {
    domain: process.env.CLOUDFRONT_DOMAIN || '',
    keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID || '',
    privateKey: loadPrivateKey(),
    signedUrlTtlSeconds: 60 * 60 * 2, // 2 hours
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
};
