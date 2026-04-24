import { Link } from 'react-router-dom';

export default function CourseCard({ course }) {
  const price = (course.price_paise ?? 100) / 100;
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group block bg-white rounded-xl border hover:shadow-xl hover:-translate-y-0.5 transition overflow-hidden"
    >
      <div className="aspect-video bg-gradient-to-br from-indigo-100 to-indigo-200 overflow-hidden">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt=""
                 className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>}
      </div>
      <div className="p-4">
        <div className="text-[11px] uppercase tracking-wider text-brand font-semibold">
          {course.category}
        </div>
        <div className="font-semibold mt-1 line-clamp-2 min-h-[3rem]">{course.title}</div>
        {course.description && (
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <span className="text-xs text-slate-500">
            {course.lesson_count ?? 0} lesson{course.lesson_count === 1 ? '' : 's'}
          </span>
          <span className="text-brand font-bold">₹{price}</span>
        </div>
      </div>
    </Link>
  );
}
