import { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function AdminArchive() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [courses, setCourses] = useState([]);
  const [targetCourse, setTargetCourse] = useState('');
  const [mode, setMode] = useState('hotlink'); // 'hotlink' | 'rehost'
  const [importing, setImporting] = useState({}); // identifier -> status
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/admin/courses').then(d => {
      setCourses(d.courses);
      if (d.courses[0]) setTargetCourse(String(d.courses[0].id));
    });
  }, []);

  async function search(e) {
    e?.preventDefault(); setErr(''); setSearching(true);
    try {
      const { items } = await api(`/admin/external/search?q=${encodeURIComponent(q)}`);
      setResults(items);
    } catch (e) { setErr(String(e.message || e)); }
    finally { setSearching(false); }
  }

  async function importOne(item) {
    if (!targetCourse) { setErr('Pick a course first'); return; }
    setImporting(prev => ({ ...prev, [item.id]: 'downloading' }));
    try {
      const r = await api('/admin/external/import-archive', {
        method: 'POST',
        body: { identifier: item.id, courseId: Number(targetCourse), mode },
      });
      setImporting(prev => ({ ...prev, [item.id]: `✓ saved as lesson #${r.lessonId}` }));
    } catch (e) {
      setImporting(prev => ({ ...prev, [item.id]: `⚠ ${e.message || e}` }));
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-1">Import from Internet Archive</h2>
        <p className="text-sm text-slate-600 mb-3">
          Only <strong>public-domain</strong> and <strong>CC-BY</strong> licensed items are shown — you can legally re-host these
          on your site and charge for access. Downloads are streamed directly to your server.
        </p>
        <form onSubmit={search} className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Search term — e.g. 'python tutorial', 'calculus', 'NASA apollo'"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className="bg-brand text-white px-4 rounded font-semibold" disabled={searching || !q.trim()}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>
        {err && <div className="text-red-600 text-sm mt-2">{err}</div>}

        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <label className="text-sm text-slate-600">Import into course:</label>
          <select value={targetCourse} onChange={e => setTargetCourse(e.target.value)}
                  className="border rounded px-2 py-1.5 text-sm">
            {courses.length === 0 ? <option value="">— no courses —</option> :
              courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <label className="text-sm text-slate-600 ml-2">Mode:</label>
          <select value={mode} onChange={e => setMode(e.target.value)}
                  className="border rounded px-2 py-1.5 text-sm">
            <option value="hotlink">Hotlink (recommended)</option>
            <option value="rehost">Re-host (download to disk)</option>
          </select>
          <span className="text-xs text-slate-400">
            {mode === 'hotlink'
              ? 'Stores archive.org URL — no storage, works on any host'
              : 'Downloads the file — needs persistent disk in production'}
          </span>
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((it) => {
            const status = importing[it.id];
            return (
              <div key={it.id} className="bg-white border rounded-xl overflow-hidden">
                <div className="flex gap-3 p-4">
                  <img src={it.thumbnailUrl} alt=""
                       className="w-32 h-20 object-cover rounded bg-slate-100 flex-shrink-0"
                       onError={(e) => { e.target.style.visibility = 'hidden'; }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold line-clamp-2">{it.title}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-green-50 text-green-700 mr-2">
                        {it.licenseLabel}
                      </span>
                      {it.downloads ? <span>{it.downloads.toLocaleString()} downloads</span> : null}
                    </div>
                    {it.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{it.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 pb-3 text-xs">
                  <a href={it.detailsUrl} target="_blank" rel="noopener noreferrer"
                     className="text-slate-500 hover:text-brand">
                    View on archive.org ↗
                  </a>
                  <button
                    disabled={!!status && status !== 'error' || !targetCourse}
                    onClick={() => importOne(it)}
                    className="bg-brand text-white px-3 py-1.5 rounded font-semibold disabled:opacity-60"
                  >
                    {status === 'downloading' ? 'Downloading…' : status?.startsWith('✓') ? 'Imported' : 'Import'}
                  </button>
                </div>
                {status && !status.startsWith('✓') && status !== 'downloading' && (
                  <div className="px-4 pb-3 text-xs text-red-600">{status}</div>
                )}
                {status?.startsWith('✓') && (
                  <div className="px-4 pb-3 text-xs text-green-700">{status}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && q && !searching && !err && (
        <p className="text-slate-500 text-sm">No results. Try broader terms, or different keywords.</p>
      )}
    </div>
  );
}
