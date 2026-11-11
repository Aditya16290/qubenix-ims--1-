import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate } from '../api';
import { Badge, Empty, ErrorMsg, Modal, PageHead } from '../components/ui';

const Link = ({ href, children }) => (
  <a href={href} target="_blank" rel="noreferrer" className="break-all font-semibold text-volt-600 hover:underline">{children}</a>
);

function Links({ s, big }) {
  return (
    <div className={`space-y-1 ${big ? 'text-lg' : 'text-sm'}`}>
      {s.githubUrl && <p>GitHub: <Link href={s.githubUrl}>{s.githubUrl}</Link></p>}
      {s.documentUrl && <p>Document: <Link href={s.documentUrl}>{s.documentUrl}</Link></p>}
      {!s.githubUrl && !s.documentUrl && <p className="text-ink-500">No links attached.</p>}
    </div>
  );
}

/* Full-screen view for showing a submission live in a meeting */
function Present({ task, onClose }) {
  const s = task.submission;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-900 p-6 text-white md:p-16">
      <button onClick={onClose} className="fixed right-6 top-6 rounded-md border border-ink-700 px-3 py-1.5 text-sm font-semibold hover:bg-ink-800">Exit (Esc)</button>
      <div className="mx-auto max-w-3xl space-y-6 text-white [&_a]:text-volt-100 [&_.text-ink-500]:text-ink-300">
        <p className="text-ink-300">{task.assignedTo?.name} · {task.assignedTo?.department}</p>
        <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">{task.title}</h1>
        <p className="whitespace-pre-wrap text-xl leading-relaxed text-ink-100">{s.description}</p>
        <Links s={s} big />
        <p className="text-sm text-ink-300">Submitted {fmtDate(s.submittedAt)}</p>
      </div>
    </div>
  );
}

function Review({ task, onClose, onSaved }) {
  const s = task.submission;
  const [feedback, setFeedback] = useState(s.feedback || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const decide = async (reviewStatus) => {
    setBusy(true); setError('');
    try { await api(`/tasks/${task._id}/review`, { method: 'PATCH', body: { reviewStatus, feedback } }); onSaved(); }
    catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <Modal title="Review submission" onClose={onClose}>
      <div className="space-y-4">
        <div><p className="text-lg font-bold">{task.title}</p><p className="text-sm text-ink-500">{task.assignedTo?.name} · submitted {fmtDate(s.submittedAt)}</p></div>
        <p className="whitespace-pre-wrap rounded-md bg-ink-50 p-3 text-sm">{s.description}</p>
        <Links s={s} />
        <label className="block"><span className="label">Feedback for the intern</span>
          <textarea className="input min-h-[80px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} /></label>
        <ErrorMsg>{error}</ErrorMsg>
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn-danger" disabled={busy} onClick={() => decide('Changes Requested')}>Request changes</button>
          <button className="btn-primary" disabled={busy} onClick={() => decide('Approved')}>Approve and complete task</button>
        </div>
      </div>
    </Modal>
  );
}

export default function Submissions() {
  const [tasks, setTasks] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [presenting, setPresenting] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => { api('/tasks?hasSubmission=true').then(setTasks).catch((e) => setError(e.message)); }, []);
  useEffect(load, [load]);
  useEffect(() => {
    if (!presenting) return;
    const onKey = (e) => e.key === 'Escape' && setPresenting(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting]);

  return (
    <>
      <PageHead title="Submissions" subtitle="Review work, update its status, or present it in a meeting." />
      <ErrorMsg>{error}</ErrorMsg>
      <div className="panel mt-2">
        {!tasks ? <Empty>Loading…</Empty> : tasks.length === 0 ? <Empty>Nothing submitted yet. Interns can submit from their task list.</Empty> : (
          <ul className="divide-y divide-ink-100">
            {[...tasks].sort((a, b) => (a.submission.reviewStatus === 'Submitted' ? -1 : 1) - (b.submission.reviewStatus === 'Submitted' ? -1 : 1)).map((t) => (
              <li key={t._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-sm text-ink-500">{t.assignedTo?.name} · {fmtDate(t.submission.submittedAt)}</p>
                  <p className="mt-1 line-clamp-1 max-w-xl text-sm">{t.submission.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={t.submission.reviewStatus} />
                  <button className="btn-ghost" onClick={() => setPresenting(t)}>Present</button>
                  <button className="btn-primary" onClick={() => setReviewing(t)}>Review</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {reviewing && <Review task={reviewing} onClose={() => setReviewing(null)} onSaved={() => { setReviewing(null); load(); }} />}
      {presenting && <Present task={presenting} onClose={() => setPresenting(null)} />}
    </>
  );
}
