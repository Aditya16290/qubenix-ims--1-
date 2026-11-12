import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate } from '../api';
import { Badge, ErrorMsg, PageHead } from '../components/ui';

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      setS(await api('/dashboard/stats'));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
    const interval = window.setInterval(load, 15000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', load);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [load]);
  if (error) return <ErrorMsg>{error}</ErrorMsg>;
  if (!s) return <p className="text-ink-500">Loading…</p>;

  const pct = (n) => (s.totalTasks ? (n / s.totalTasks) * 100 : 0);
  const stats = [
    ['Total interns', s.totalInterns], ['Active interns', s.activeInterns],
    ['Assigned tasks', s.totalTasks], ['Completed tasks', s.completedTasks], ['Pending tasks', s.pendingTasks],
  ];

  return (
    <>
      <PageHead title="Dashboard" subtitle="Where the internship programme stands today." />

      <section className="panel mb-6 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-bold">Task progress</h2>
          <p className="text-sm text-ink-500">{s.completedTasks} of {s.totalTasks} completed</p>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-ink-100" role="img" aria-label="Task progress bar">
          <div className="bg-emerald-500" style={{ width: `${pct(s.completedTasks)}%` }} />
          <div className="bg-volt-500" style={{ width: `${pct(s.inProgressTasks)}%` }} />
          <div className="bg-amber-400" style={{ width: `${pct(s.pendingTasks)}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-500">
          <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />Completed {s.completedTasks}</span>
          <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-volt-500" />In progress {s.inProgressTasks}</span>
          <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-400" />Pending {s.pendingTasks}</span>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map(([label, n]) => (
          <div key={label} className="panel p-4">
            <p className="text-3xl font-extrabold tabular-nums">{n}</p>
            <p className="text-sm text-ink-500">{label}</p>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="font-bold">Latest submissions {s.awaitingReview > 0 && <span className="ml-2 text-sm font-semibold text-volt-600">{s.awaitingReview} awaiting review</span>}</h2>
          <Link to="/submissions" className="text-sm font-semibold text-volt-600 hover:underline">Review all</Link>
        </div>
        {s.recent.length === 0 ? <p className="px-5 py-8 text-center text-sm text-ink-500">No submissions yet. They appear here when interns hand in work.</p> : (
          <ul className="divide-y divide-ink-100">
            {s.recent.map((t) => (
              <li key={t._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span><b>{t.assignedTo?.name || 'Removed intern'}</b> submitted “{t.title}”</span>
                <span className="flex items-center gap-3"><span className="text-ink-500">{fmtDate(t.submission.submittedAt)}</span><Badge value={t.submission.reviewStatus} /></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
