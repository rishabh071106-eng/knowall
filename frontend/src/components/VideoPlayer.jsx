import { useEffect, useState } from 'react';
import { api } from '../api.js';

// Extract YouTube video id from any common URL shape
function youtubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Streams a lesson video via a time-limited signed URL, direct URL, or YouTube embed.
export default function VideoPlayer({ lessonId }) {
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    setUrl(''); setErr('');
    (async () => {
      try {
        const { url } = await api(`/video/${lessonId}/url`);
        setUrl(url);
      } catch (e) {
        setErr(String(e.message || e));
      }
    })();
  }, [lessonId]);

  if (err) return <div className="p-6 bg-red-50 text-red-700 rounded">Could not load video: {err}</div>;
  if (!url) return <div className="p-6 bg-slate-100 rounded animate-pulse aspect-video" />;

  // YouTube embed
  const ytId = youtubeId(url);
  if (ytId) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
          title="Lesson"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Direct / signed video file
  return (
    <div className="relative" onContextMenu={(e) => e.preventDefault()}>
      <video
        src={url}
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        className="w-full rounded-lg bg-black aspect-video"
      />
    </div>
  );
}
