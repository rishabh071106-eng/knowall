import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSignedUrl as getCloudFrontSignedUrl } from '@aws-sdk/cloudfront-signer';
import { config } from '../config.js';

export const s3 = new S3Client({
  region: config.aws.region,
  credentials: config.aws.accessKeyId
    ? { accessKeyId: config.aws.accessKeyId, secretAccessKey: config.aws.secretAccessKey }
    : undefined,
});

// Presigned PUT URL for direct browser upload to S3 (admin only).
export async function presignUpload({ key, contentType }) {
  const cmd = new PutObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: key,
    ContentType: contentType,
  });
  return getS3SignedUrl(s3, cmd, { expiresIn: 60 * 15 }); // 15 min
}

// Time-limited CloudFront URL for a video path (students, after purchase).
export function signCloudFrontUrl(objectPath) {
  if (!config.cloudfront.domain || !config.cloudfront.keyPairId || !config.cloudfront.privateKey) {
    throw new Error('CloudFront signing is not configured');
  }
  const url = `https://${config.cloudfront.domain}/${objectPath.replace(/^\//, '')}`;
  const dateLessThan = new Date(Date.now() + config.cloudfront.signedUrlTtlSeconds * 1000).toISOString();

  return getCloudFrontSignedUrl({
    url,
    keyPairId: config.cloudfront.keyPairId,
    privateKey: config.cloudfront.privateKey,
    dateLessThan,
  });
}
