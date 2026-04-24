import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      await signup(email, password, name, role === 'instructor');
      nav(role === 'instructor' ? '/admin' : '/');
    } catch (e) { setErr(String(e.message || e)); }
  }

  return (
    <div className="max-w-sm mx-auto bg-white border rounded-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Create your account</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Your name"
               value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Email"
               value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password"
               placeholder="Password (min 6 chars)"
               value={password} onChange={e => setPassword(e.target.value)} />

        <fieldset className="border rounded p-3">
          <legend className="text-xs text-slate-500 px-1">I want to…</legend>
          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="role" value="student" checked={role === 'student'}
                     onChange={e => setRole(e.target.value)} className="mt-1" />
              <span>
                <span className="font-semibold">Learn</span>
                <span className="block text-xs text-slate-500">Browse and buy courses for ₹10 each.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="radio" name="role" value="instructor" checked={role === 'instructor'}
                     onChange={e => setRole(e.target.value)} className="mt-1" />
              <span>
                <span className="font-semibold">Teach</span>
                <span className="block text-xs text-slate-500">Create and publish courses. Earn 50% of each sale.</span>
              </span>
            </label>
          </div>
        </fieldset>

        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-brand text-white rounded py-2 font-semibold">
          {role === 'instructor' ? 'Sign up & teach' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm text-slate-500 mt-4">
        Already have an account? <Link to="/login" className="text-brand underline">Log in</Link>
      </p>
    </div>
  );
}
