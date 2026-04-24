import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

export default function AdminCourses() {
  const [courses, setCourses] = useState(null);
  const [filter, setFilter] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    try { const { courses } = await api('/admin/courses'); setCourses(courses); }
    catch (e) { setErr(String(e.message || e)); }
  }
  useEffect(() => { load(); }, []);

  async function del(id) {
    if (!confirm('Delete this course and all its lessons? This cannot be undone.')) return;
    await api(`/admin/courses/${id}`, { method: 'DELETE' });
    load();
  }

  if (!courses) return <div className="text-slate-500">Loading…</div>;
  const q = filter.trim().toLowerCase();
  const filtered = q ? courses.filter(c =>
    c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
  ) : courses;

  const totalLessons = courses.reduce((a, c) => a + Number(c.lesson_count || 0), 0);
  const missing = courses.reduce((a, c) => a + Number(c.missing_video || 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          placeholder="Search by title or category…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded px-3 py-2 flex-1 min-w-[200px]"
        />
        <Link to="/admin/new" className="bg-brand text-white px-4 py-2 rounded font-semibold text-sm whitespace-nowrap">
          + New course
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 text-center">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">{courses.length}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Courses</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold">{totalLessons}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Lessons</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className={`text-2xl font-bold ${missing > 0 ? 'text-amber-600' : ''}`}>{missing}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Missing video</div>
        </div>
      </div>

      {err && <div className="text-red-600 text-sm mb-3">{err}</div>}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Lessons</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-t hover:bg-slate-50">
                <td className="p-3">
                  <Link to={`/admin/courses/${c.id}`} className="font-medium text-brand hover:underline">
                    {c.title}
                  </Link>
                  {c.missing_video > 0 && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      {c.missing_video} no video
                    </span>
                  )}
                </td>
                <td className="p-3 text-slate-600">{c.category}</td>
                <td className="p-3 text-right tabular-nums">{c.lesson_count}</td>
                <td className="p-3 text-right tabular-nums">₹{c.price_paise / 100}</td>
                <td className="p-3 text-right">
                  <Link to={`/admin/courses/${c.id}`} className="text-xs text-brand hover:underline mr-3">Edit</Link>
                  <button onClick={() => del(c.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500">No matches.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
