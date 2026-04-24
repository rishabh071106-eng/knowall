import { useEffect, useState } from 'react';
import { api } from '../api.js';
import CourseCard from '../components/CourseCard.jsx';
import { Link } from 'react-router-dom';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border overflow-hidden animate-pulse">
      <div className="aspect-video bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-4/5" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function Home() {
  const [courses, setCourses] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api('/courses', { auth: false }).then(d => setCourses(d.courses));
    api('/courses/categories', { auth: false }).then(d => setCategories(d.categories));
  }, []);

  const featured = (courses || []).slice(0, 3);
  const rest = (courses || []).slice(3);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white rounded-2xl p-10 md:p-14 mb-10">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Learn anything <span className="text-yellow-200">for ₹10.</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl opacity-90 max-w-2xl">
            Every course is ten rupees. Pay once with UPI, card, or netbanking, and watch forever.
            No subscriptions. No nonsense.
          </p>
          <div className="mt-6 flex gap-2 flex-wrap">
            {['Maths', 'AI', 'Java', 'Python', 'Web Development', 'Design'].map(c => (
              <Link key={c} to={`/category/${c.toLowerCase()}`}
                    className="px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur rounded-full text-sm font-medium">
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xl font-semibold">Browse by topic</h2>
            <span className="text-sm text-slate-500">{categories.length} categories</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <Link key={c.category} to={`/category/${c.category.toLowerCase()}`}
                    className="px-3 py-1.5 bg-white border rounded-full text-sm hover:border-brand hover:text-brand transition">
                {c.category} <span className="text-slate-400">· {c.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Featured this week</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-3">All courses</h2>
        {courses === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : rest.length === 0 && featured.length === 0 ? (
          <p className="text-slate-500">No courses yet — sign up and create the first one in the admin panel.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </section>
    </div>
  );
}
