import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try { await login(email, password); nav('/'); }
    catch (e) { setErr(String(e.message || e)); }
  }

  return (
    <div className="max-w-sm mx-auto bg-white border rounded-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Email"
               value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password"
               value={password} onChange={e => setPassword(e.target.value)} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-brand text-white rounded py-2 font-semibold">Log in</button>
      </form>
      <p className="text-sm text-slate-500 mt-4">
        No account? <Link to="/signup" className="text-brand underline">Sign up</Link>
      </p>
    </div>
  );
}
