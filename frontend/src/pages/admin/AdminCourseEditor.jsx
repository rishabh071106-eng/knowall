import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api.js';
import MultiUploader from './MultiUploader.jsx';

function fmtDur(s) {
  if (!s) return '—';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
          : `${m}:${String(sec).padStart(2,'0')}`;
}

export default function AdminCourseEditor() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const { course, lessons } = await api(`/admin/courses/${id}`);
      setData({ course, lessons });
      setMeta({
        title: course.title, slug: course.slug, category: course.category,
        description: course.description || '', pricePaise: course.price_paise,
        thumbnail_url: course.thumbnail_url || '',
      });
    } catch (e) { setErr(String(e.message || e)); }
  }
  useEffect(() => { load(); }, [id]);

  async function saveMeta() {
    setSavingMeta(true); setErr('');
    try {
      await api(`/admin/courses/${id}`, {
        method: 'PATCH',
        body: { ...meta, pricePaise: Number(meta.pricePaise) || 1000 },
      });
      await load();
    } catch (e) { setErr(String(e.message || e)); }
    finally { setSavingMeta(false); }
  }

  async function deleteLesson(lid) {
    if (!confirm('Delete this lesson?')) return;
    await api(`/admin/lessons/${lid}`, { method: 'DELETE' });
    load();
  }

  async function togglePreview(l) {
    await api(`/admin/lessons/${l.id}`, { method: 'PATCH', body: { isPreview: !l.is_preview } });
    load();
  }

  async function move(lid, dir) {
    const list = [...data.lessons];
    const i = list.findIndex(l => String(l.id) === String(lid));
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await api(`/admin/courses/${id}/reorder`, {
      method: 'POST', body: { orderedIds: list.map(l => l.id) },
    });
    load();
  }

  if (!data || !meta) return <div>Loading…</div>;
  const totalDur = data.lessons.reduce((a, l) => a + Number(l.duration_seconds || 0), 0);

  return (
    <div className="space-y-6">
      <Link to="/admin" className="text-sm text-slate-500 hover:text-brand">← all courses</Link>

      <section className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-3">Course details</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block col-span-2">
            <div className="text-xs text-slate-500 mb-1">Title</div>
            <input className="w-full border rounded px-3 py-2" value={meta.title}
                   onChange={e => setMeta({ ...meta, title: e.target.value })} />
          </label>
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Slug</div>
            <input className="w-full border rounded px-3 py-2" value={meta.slug}
                   onChange={e => setMeta({ ...meta, slug: e.target.value })} />
          </label>
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Category</div>
            <input className="w-full border rounded px-3 py-2" value={meta.category}
                   onChange={e => setMeta({ ...meta, category: e.target.value })} />
          </label>
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Price (paise)</div>
            <input type="number" className="w-full border rounded px-3 py-2" value={meta.pricePaise}
                   onChange={e => setMeta({ ...meta, pricePaise: e.target.value })} />
          </label>
          <label className="block">
            <div className="text-xs text-slate-500 mb-1">Thumbnail URL</div>
            <input className="w-full border rounded px-3 py-2" value={meta.thumbnail_url}
                   onChange={e => setMeta({ ...meta, thumbnail_url: e.target.value })} />
          </label>
          <label className="block col-span-2">
            <div className="text-xs text-slate-500 mb-1">Description</div>
            <textarea rows={3} className="w-full border rounded px-3 py-2" value={meta.description}
                      onChange={e => setMeta({ ...meta, description: e.target.value })} />
          </label>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={saveMeta} disabled={savingMeta}
                  className="bg-brand text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-60">
            {savingMeta ? 'Saving…' : 'Save changes'}
          </button>
          <Link to={`/courses/${data.course.slug}`} className="text-sm text-slate-500 hover:text-brand">
            View public page ↗
          </Link>
        </div>
        {err && <div className="text-red-600 text-sm mt-2">{err}</div>}
      </section>

      <section className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">
            Lessons <span className="text-sm font-normal text-slate-500">· {data.lessons.length} · {fmtDur(totalDur)}</span>
          </h2>
        </div>
        {data.lessons.length === 0 && (
          <div className="text-sm text-slate-500 mb-3">No lessons yet. Drag videos below to add them.</div>
        )}
        <ol className="space-y-1">
          {data.lessons.map((l, i) => (
            <li key={l.id} className="flex items-center gap-3 border rounded px-3 py-2 text-sm">
              <span className="tabular-nums text-slate-400 w-6">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1 min-w-0 truncate font-medium">{l.title}</span>
              <span className="text-xs text-slate-500 tabular-nums">{fmtDur(l.duration_seconds)}</span>
              <label className="text-xs flex items-center gap-1">
                <input type="checkbox" checked={l.is_preview} onChange={() => togglePreview(l)} /> preview
              </label>
              {!l.video_key && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">no video</span>}
              <button onClick={() => move(l.id, -1)} className="text-xs text-slate-500 hover:text-brand">↑</button>
              <button onClick={() => move(l.id, +1)} className="text-xs text-slate-500 hover:text-brand">↓</button>
              <button onClick={() => deleteLesson(l.id)} className="text-xs text-red-600 hover:underline">✕</button>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-3">Add lessons — drag & drop</h2>
        <MultiUploader
          courseId={data.course.id}
          startPosition={data.lessons.length}
          onImported={() => load()}
        />
      </section>
    </div>
  );
}
