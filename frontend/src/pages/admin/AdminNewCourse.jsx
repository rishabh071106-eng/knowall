import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function AdminNewCourse() {
  const nav = useNavigate();
  const [f, setF] = useState({
    title: '', slug: '', description: '', category: 'Python',
    pricePaise: 1000, thumbnailUrl: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function upd(k, v) { setF({ ...f, [k]: v }); }

  function slugify(s) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const body = {
        title: f.title,
        slug: f.slug || slugify(f.title),
        description: f.description,
        category: f.category,
        pricePaise: Number(f.pricePaise) || 1000,
      };
      if (f.thumbnailUrl) body.thumbnailUrl = f.thumbnailUrl;
      const { course } = await api('/admin/courses', { method: 'POST', body });
      nav(`/admin/courses/${course.id}`);
    } catch (e) { setErr(String(e.message || e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="max-w-2xl bg-white border rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Create a new course</h2>
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <div className="text-sm font-medium mb-1">Title</div>
          <input className="w-full border rounded px-3 py-2" required
                 value={f.title} onChange={e => upd('title', e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm font-medium mb-1">Slug <span className="text-xs text-slate-400">(lowercase, kebab-case — auto if blank)</span></div>
          <input className="w-full border rounded px-3 py-2"
                 value={f.slug} placeholder={slugify(f.title)}
                 onChange={e => upd('slug', e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm font-medium mb-1">Category</div>
            <input className="w-full border rounded px-3 py-2" required
                   value={f.category} onChange={e => upd('category', e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm font-medium mb-1">Price (paise) <span className="text-xs text-slate-400">1000 = ₹10</span></div>
            <input type="number" className="w-full border rounded px-3 py-2"
                   value={f.pricePaise} onChange={e => upd('pricePaise', e.target.value)} />
          </label>
        </div>
        <label className="block">
          <div className="text-sm font-medium mb-1">Thumbnail URL (optional)</div>
          <input className="w-full border rounded px-3 py-2"
                 value={f.thumbnailUrl} onChange={e => upd('thumbnailUrl', e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm font-medium mb-1">Description</div>
          <textarea rows={4} className="w-full border rounded px-3 py-2"
                    value={f.description} onChange={e => upd('description', e.target.value)} />
        </label>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={busy} className="bg-brand text-white rounded px-4 py-2 font-semibold disabled:opacity-60">
          {busy ? 'Creating…' : 'Create & add lessons →'}
        </button>
      </form>
    </div>
  );
}
