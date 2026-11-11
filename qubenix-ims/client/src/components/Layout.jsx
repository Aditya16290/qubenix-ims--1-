import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const adminNav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/interns', label: 'Interns' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/submissions', label: 'Submissions' },
];
const internNav = [{ to: '/my-tasks', label: 'My tasks' }];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return <Outlet />; // Guard in App redirects to /login
  const nav = user.role === 'admin' ? adminNav : internNav;

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-ink-900 text-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:flex md:flex-col">
        <div className="px-5 py-5">
          <p className="text-lg font-extrabold tracking-tight">Qubenix<span className="text-volt-500">.</span>ai</p>
          <p className="text-xs text-ink-300">Automate. Integrate. Elevate.</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-volt-500 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white'}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-ink-800 p-4 md:block">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-ink-300">{user.email}</p>
          <button className="mt-3 text-sm font-semibold text-ink-300 hover:text-white" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mb-4 flex justify-end md:hidden">
          <button className="btn-ghost" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
