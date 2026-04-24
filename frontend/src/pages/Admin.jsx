import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import AdminCourses from './admin/AdminCourses.jsx';
import AdminCourseEditor from './admin/AdminCourseEditor.jsx';
import AdminNewCourse from './admin/AdminNewCourse.jsx';
import AdminImport from './admin/AdminImport.jsx';
import AdminArchive from './admin/AdminArchive.jsx';

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">{isAdmin ? 'Admin' : 'Teach'}</h1>
        <nav className="flex gap-1 text-sm flex-wrap">
          <Link to="/admin" className="px-3 py-1.5 rounded hover:bg-slate-100">
            {isAdmin ? 'All courses' : 'My courses'}
          </Link>
          <Link to="/admin/new" className="px-3 py-1.5 rounded hover:bg-slate-100">+ New course</Link>
          <Link to="/admin/archive" className="px-3 py-1.5 rounded hover:bg-slate-100">📼 Internet Archive</Link>
          {isAdmin && <Link to="/admin/import" className="px-3 py-1.5 rounded hover:bg-slate-100">Bulk CSV import</Link>}
        </nav>
      </div>
      <Routes>
        <Route path="/" element={<AdminCourses />} />
        <Route path="/new" element={<AdminNewCourse />} />
        <Route path="/courses/:id" element={<AdminCourseEditor />} />
        <Route path="/import" element={<AdminImport />} />
        <Route path="/archive" element={<AdminArchive />} />
      </Routes>
    </div>
  );
}
