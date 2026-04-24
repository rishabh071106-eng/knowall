import { useEffect, useState } from 'react';
import { api } from '../api.js';
import CourseCard from '../components/CourseCard.jsx';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  useEffect(() => { api('/courses/mine/list').then(d => setCourses(d.courses)); }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My courses</h1>
      {courses.length === 0 ? (
        <p className="text-slate-500">You haven't bought any courses yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  );
}
