// Stub: trigger an AWS MediaConvert job to transcode an uploaded MP4 into an HLS ladder.
// Wire this up once you've created a MediaConvert job template in the AWS console.
//
// Typical flow:
//   1. Admin uploads raw.mp4 to  s3://$BUCKET/uploads/<lessonId>/raw.mp4
//   2. Call startHlsJob({ lessonId }) — this creates an HLS ladder in
//        s3://$BUCKET/hls/<lessonId>/index.m3u8
//   3. Store `hls/<lessonId>/index.m3u8` as lessons.video_key.
//
// For MVP, you can skip transcoding and serve the raw MP4 — just set
// lessons.video_key to `uploads/<lessonId>/raw.mp4`.

export async function startHlsJob(/* { lessonId, inputKey, jobTemplate, role } */) {
  throw new Error('mediaconvert.startHlsJob not implemented — see file header');
}
