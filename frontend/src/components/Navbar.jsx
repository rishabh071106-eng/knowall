import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const linkCls = ({ isActive }) =>
    `px-3 py-2 text-sm rounded hover:bg-slate-100 ${isActive ? 'text-brand font-semibold' : 'text-slate-700'}`;

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="text-2xl font-bold text-brand">Knowall</Link>
        <nav className="hidden md:flex items-center gap-1 ml-4 flex-wrap">
          <NavLink to="/category/maths"            className={linkCls}>Maths</NavLink>
          <NavLink to="/category/ai"               className={linkCls}>AI</NavLink>
          <NavLink to="/category/java"             className={linkCls}>Java</NavLink>
          <NavLink to="/category/python"           className={linkCls}>Python</NavLink>
          <NavLink to="/category/web development"  className={linkCls}>Web</NavLink>
          <NavLink to="/category/design"           className={linkCls}>Design</NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <NavLink to="/my" className={linkCls}>My courses</NavLink>
              {user.role === 'admin'      && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
              {user.role === 'instructor' && <NavLink to="/admin" className={linkCls}>Teach</NavLink>}
              <span className="text-sm text-slate-500">{user.email}</span>
              <button onClick={logout} className="text-sm px-3 py-1.5 rounded border">Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkCls}>Log in</NavLink>
              <Link to="/signup" className="text-sm px-3 py-1.5 rounded bg-brand text-white">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
