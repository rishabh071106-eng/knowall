import { useState } from 'react';
import { api } from '../../api.js';

export default function AdminImport() {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const example = `course_slug,title,video_url,position,duration_seconds,is_preview
python-for-absolute-beginners,Intro to Python,https://www.youtube.com/watch?v=_uQrJ0TkZlc,0,900,true
python-for-absolute-beginners,Variables in Python,https://www.youtube.com/watch?v=OH86oLzVzzw,1,720,false
neural-networks-from-scratch,What is a neural network?,https://www.youtube.com/watch?v=aircAruvnKk,0,1140,true`;

  async function submit() {
    setErr(''); setResult(null); setBusy(true);
    try {
      const r = await api('/admin/bulk-import', { method: 'POST', body: { csv } });
      setResult(r);
    } catch (e) { setErr(String(e.message || e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="max-w-3xl bg-white border rounded-xl p-5">
      <h2 className="font-semibold mb-2">Bulk import lessons (CSV or TSV)</h2>
      <p className="text-sm text-slate-600 mb-3">
        Paste a spreadsheet. Required columns: <code>course_slug</code>, <code>title</code>, <code>video_url</code>.
        Optional: <code>position</code>, <code>duration_seconds</code>, <code>is_preview</code>.
        YouTube URLs auto-detected and embedded.
      </p>
      <div className="flex gap-2 mb-2">
        <button onClick={() => setCsv(example)} className="text-xs px-3 py-1 border rounded">Load example</button>
        <button onClick={() => setCsv('')} className="text-xs px-3 py-1 border rounded">Clear</button>
      </div>
      <textarea
        value={csv} onChange={e => setCsv(e.target.value)} rows={14}
        placeholder="Paste CSV or TSV — a Google Sheet copy/paste works."
        className="w-full border rounded px-3 py-2 font-mono text-xs"
      />
      <div className="flex items-center gap-3 mt-3">
        <button onClick={submit} disabled={busy || !csv.trim()}
                className="bg-brand text-white rounded px-4 py-2 font-semibold disabled:opacity-50">
          {busy ? 'Importing…' : 'Import'}
        </button>
        <span className="text-xs text-slate-500">{csv.split(/\r?\n/).filter(Boolean).length - 1} data row(s)</span>
      </div>
      {err && <div className="text-red-600 text-sm mt-3">{err}</div>}
      {result && (
        <div className="mt-4 text-sm">
          <div className="font-semibold text-green-700">✓ Inserted {result.inserted} lessons</div>
          {result.errors?.length > 0 && (
            <details className="mt-2">
              <summary className="text-red-600 cursor-pointer">{result.errors.length} errors</summary>
              <ul className="mt-1 list-disc list-inside text-xs text-red-700">
                {result.errors.slice(0, 30).map((e, i) => <li key={i}>row {e.row}: {e.error}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
