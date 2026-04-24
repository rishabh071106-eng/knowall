import { useEffect, useRef, useState } from 'react';
import { api } from '../../api.js';

// Extract video duration (seconds) client-side by loading metadata.
function extractDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      const d = Math.round(v.duration || 0);
      URL.revokeObjectURL(url);
      resolve(d);
    };
    v.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    v.src = url;
  });
}

// Turn "01-intro.mp4" → "Intro". "chapter_3 variables.mp4" → "Chapter 3 Variables".
function titleFromFilename(name) {
  let t = name.replace(/\.[^.]+$/, '');
  t = t.replace(/^\d+[\s._-]*/, '');     // strip leading order prefix
  t = t.replace(/[_-]+/g, ' ').trim();
  return t.replace(/\b\w/g, c => c.toUpperCase()) || name;
}

// Upload one file. Returns { key } where key is a URL (dev) or S3 key (prod).
async function uploadOne(file, mode, onProgress) {
  if (mode === 'local') {
    // multipart POST with XHR for progress events
    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append('file', file);
      xhr.open('POST', '/api/admin/local-upload');
      const token = localStorage.getItem('knowall_token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
        else reject(new Error(`upload failed: ${xhr.status} ${xhr.responseText}`));
      };
      xhr.onerror = () => reject(new Error('network error'));
      xhr.send(form);
    });
  }

  // S3 mode
  const { uploadUrl, key } = await api('/admin/upload-url', {
    method: 'POST', body: { filename: file.name, contentType: file.type || 'video/mp4' },
  });
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`s3 ${xhr.status}`));
    xhr.onerror = () => reject(new Error('network error'));
    xhr.send(file);
  });
  return { key };
}

// Simple concurrency-limited async queue.
async function pool(items, limit, fn) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const my = i++;
      await fn(items[my], my);
    }
  });
  await Promise.all(runners);
}

export default function MultiUploader({ courseId, startPosition = 0, onImported }) {
  const [files, setFiles] = useState([]);
  const [mode, setMode] = useState(null);
  const [uploading, setUploading] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => { api('/admin/upload-mode').then(({ mode }) => setMode(mode)); }, []);

  // Prep a dropped/selected file list: extract duration + auto title.
  async function queue(fileList) {
    const list = Array.from(fileList).filter(f => /^video\//.test(f.type) || /\.(mp4|mov|webm|mkv|m4v)$/i.test(f.name));
    if (list.length === 0) return;

    // Preserve filename-order by sorting numerically (natural)
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const prepared = await Promise.all(list.map(async (file) => ({
      file,
      title: titleFromFilename(file.name),
      durationSeconds: await extractDuration(file),
      isPreview: false,
      progress: 0,
      status: 'queued',
      error: null,
      videoKey: null,
    })));
    setFiles(prev => [...prev, ...prepared]);
  }

  function onDrop(e) {
    e.preventDefault(); e.stopPropagation();
    dropRef.current?.classList.remove('ring-2');
    // Prefer webkitGetAsEntry to descend into folders.
    const items = e.dataTransfer.items;
    if (items && items.length && items[0].webkitGetAsEntry) {
      const all = [];
      const walk = (entry) => new Promise((resolve) => {
        if (entry.isFile) entry.file((f) => { all.push(f); resolve(); });
        else if (entry.isDirectory) {
          entry.createReader().readEntries(async (ents) => {
            for (const en of ents) await walk(en);
            resolve();
          });
        } else resolve();
      });
      Promise.all(Array.from(items).map(it => {
        const ent = it.webkitGetAsEntry();
        return ent ? walk(ent) : Promise.resolve();
      })).then(() => queue(all));
    } else {
      queue(e.dataTransfer.files);
    }
  }

  async function startUpload() {
    if (!mode) return;
    setUploading(true);
    const idxs = files.map((_, i) => i).filter(i => files[i].status === 'queued' || files[i].status === 'error');
    await pool(idxs, 3, async (idx) => {
      setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'uploading', error: null } : f));
      try {
        const { key } = await uploadOne(files[idx].file, mode, (p) => {
          setFiles(prev => prev.map((f, i) => i === idx ? { ...f, progress: p } : f));
        });
        setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'uploaded', progress: 1, videoKey: key } : f));
      } catch (e) {
        setFiles(prev => prev.map((f, i) => i === idx ? { ...f, status: 'error', error: e.message } : f));
      }
    });

    // Save all uploaded lessons in one batch.
    const current = await new Promise(r => setFiles(prev => (r(prev), prev)));
    const toSave = current
      .map((f, i) => ({ ...f, _idx: i }))
      .filter(f => f.status === 'uploaded' && f.videoKey);

    if (toSave.length) {
      const { inserted } = await api('/admin/lessons/batch', {
        method: 'POST',
        body: {
          courseId,
          lessons: toSave.map((f, i) => ({
            title: f.title,
            position: startPosition + i,
            durationSeconds: f.durationSeconds,
            isPreview: f.isPreview,
            videoKey: f.videoKey,
          })),
        },
      });
      setFiles(prev => prev.map(f => (
        toSave.find(s => s._idx === prev.indexOf(f)) ? { ...f, status: 'saved' } : f
      )));
      onImported?.(inserted);
    }
    setUploading(false);
  }

  function removeFile(i) { setFiles(prev => prev.filter((_, x) => x !== i)); }
  function setTitle(i, t) { setFiles(prev => prev.map((f, x) => x === i ? { ...f, title: t } : f)); }
  function togglePreview(i) { setFiles(prev => prev.map((f, x) => x === i ? { ...f, isPreview: !f.isPreview } : f)); }

  const totalMB = files.reduce((a, f) => a + f.file.size / (1024 * 1024), 0);

  return (
    <div>
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add('ring-2'); }}
        onDragLeave={() => dropRef.current?.classList.remove('ring-2')}
        onDrop={onDrop}
        className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center ring-brand transition cursor-pointer"
        onClick={() => document.getElementById('file-input').click()}
      >
        <div className="text-4xl mb-2">📹</div>
        <div className="font-semibold">Drag videos or a folder here</div>
        <div className="text-sm text-slate-500 mt-1">
          …or <span className="text-brand underline">click to browse</span>.
          Multiple files supported. {mode === 'local' ? 'Saving locally (dev mode)' : mode === 's3' ? 'Uploading to S3' : '…'}
        </div>
        <input id="file-input" type="file" multiple accept="video/*" className="hidden"
               onChange={(e) => queue(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600">
              {files.length} file{files.length === 1 ? '' : 's'} queued · {totalMB.toFixed(1)} MB total
            </div>
            <div className="flex gap-2">
              <button onClick={() => setFiles([])} disabled={uploading}
                      className="text-sm px-3 py-1.5 border rounded disabled:opacity-50">
                Clear
              </button>
              <button onClick={startUpload} disabled={uploading}
                      className="bg-brand text-white text-sm px-4 py-1.5 rounded font-semibold disabled:opacity-50">
                {uploading ? 'Uploading…' : `Upload & create ${files.length} lesson${files.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
          <ul className="space-y-2 max-h-[500px] overflow-auto border rounded-lg bg-white">
            {files.map((f, i) => (
              <li key={i} className="p-3 border-b last:border-b-0 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    value={f.title}
                    onChange={(e) => setTitle(i, e.target.value)}
                    disabled={f.status === 'uploading' || f.status === 'saved'}
                    className="w-full border-0 border-b border-transparent focus:border-slate-300 outline-none font-medium text-sm"
                  />
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>{f.file.name}</span>
                    <span>{(f.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                    {f.durationSeconds > 0 && <span>{Math.floor(f.durationSeconds / 60)}:{String(f.durationSeconds % 60).padStart(2,'0')}</span>}
                    <label className="flex items-center gap-1 ml-auto">
                      <input type="checkbox" checked={f.isPreview} onChange={() => togglePreview(i)}
                             disabled={f.status === 'saved'} />
                      Preview
                    </label>
                  </div>
                  {f.status === 'uploading' && (
                    <div className="mt-2 h-1 bg-slate-100 rounded">
                      <div className="h-1 bg-brand rounded transition-all"
                           style={{ width: `${Math.round(f.progress * 100)}%` }} />
                    </div>
                  )}
                  {f.status === 'uploaded' && <div className="text-xs text-green-600 mt-1">✓ uploaded</div>}
                  {f.status === 'saved' && <div className="text-xs text-green-600 mt-1">✓ saved</div>}
                  {f.error && <div className="text-xs text-red-600 mt-1">⚠ {f.error}</div>}
                </div>
                {f.status !== 'saved' && (
                  <button onClick={() => removeFile(i)} disabled={uploading}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-30">✕</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
