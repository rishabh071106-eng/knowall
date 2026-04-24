import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import CourseCard from '../components/CourseCard.jsx';

export default function Category() {
  const { slug } = useParams();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api(`/courses?category=${encodeURIComponent(slug)}`, { auth: false })
      .then(d => setCourses(d.courses));
  }, [slug]);

  return (
    <div>
      <h1 className="text-3xl font-bold capitalize mb-4">{slug}</h1>
      {courses.length === 0 ? (
        <p className="text-slate-500">No courses here yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  );
}
