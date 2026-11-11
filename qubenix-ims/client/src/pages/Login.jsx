import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { ErrorMsg } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('admin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const u = await login(form.email, form.password, role);
      navigate(u.role === 'admin' ? '/' : '/my-tasks');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink-900 p-12 text-white md:flex">
        <p className="text-xl font-extrabold">Qubenix<span className="text-volt-500">.</span>ai</p>
        <div>
          <h1 className="max-w-sm text-4xl font-extrabold leading-tight">Every intern, every task, one clear picture.</h1>
          <p className="mt-4 max-w-sm text-ink-300">Assign work, track progress and review submissions without chasing anyone in chat.</p>
        </div>
        <p className="text-sm text-ink-300">Automate. Integrate. Elevate.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-extrabold">Log in</h2>
          <div className="grid grid-cols-2 gap-1 rounded-md bg-ink-100 p-1" role="tablist">
            {['admin', 'intern'].map((r) => (
              <button type="button" key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)}
                className={`rounded px-3 py-1.5 text-sm font-semibold capitalize ${role === r ? 'bg-white shadow-sm' : 'text-ink-500'}`}>{r}</button>
            ))}
          </div>
          <ErrorMsg>{error}</ErrorMsg>
          <label className="block"><span className="label">Email</span>
            <input className="input" type="email" required autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="block"><span className="label">Password</span>
            <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        </form>
      </div>
    </div>
  );
}
