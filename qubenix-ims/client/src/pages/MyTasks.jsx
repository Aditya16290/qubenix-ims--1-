import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate } from '../api';
import { useAuth } from '../auth';
import { Badge, Empty, ErrorMsg, Field, Modal, PageHead, isOverdue } from '../components/ui';

function SubmitForm({ task, onClose, onSaved }) {
  const s = task.submission;
  const [f, setF] = useState({ description: s?.description || '', githubUrl: s?.githubUrl || '', documentUrl: s?.documentUrl || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api(`/tasks/${task._id}/submit`, { method: 'POST', body: f }); onSaved(); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <Modal title={s ? 'Update submission' : 'Submit work'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="font-semibold">{task.title}</p>
        <ErrorMsg>{error}</ErrorMsg>
        <Field label="What did you do?"><textarea className="input min-h-[110px]" required value={f.description} onChange={set('description')} /></Field>
        <Field label="GitHub URL (optional)"><input className="input" type="url" placeholder="https://github.com/…" value={f.githubUrl} onChange={set('githubUrl')} /></Field>
        <Field label="Document link (optional)"><input className="input" type="url" placeholder="https://docs.google.com/…" value={f.documentUrl} onChange={set('documentUrl')} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : s ? 'Update submission' : 'Submit work'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => { api('/tasks/my').then(setTasks).catch((e) => setError(e.message)); }, []);
  useEffect(load, [load]);

  const start = async (t) => {
    try { await api(`/tasks/${t._id}/status`, { method: 'PATCH', body: { status: 'In Progress' } }); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <>
      <PageHead title={`Hi, ${user.name.split(' ')[0]}`} subtitle="Your assigned tasks. Submit your work when it is ready." />
      <ErrorMsg>{error}</ErrorMsg>
      {!tasks ? <Empty>Loading…</Empty> : tasks.length === 0 ? <div className="panel"><Empty>No tasks assigned yet. Check back soon.</Empty></div> : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <article key={t._id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{t.title}</h2>
                  <p className="text-sm text-ink-500">Due {fmtDate(t.deadline)} {isOverdue(t) && <span className="font-semibold text-red-600">· Overdue</span>}</p>
                </div>
                <div className="flex gap-2"><Badge value={t.priority} /><Badge value={t.status} /></div>
              </div>
              {t.description && <p className="mt-3 whitespace-pre-wrap text-sm">{t.description}</p>}
              {t.submission && (
                <div className="mt-4 rounded-md bg-ink-50 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-2 font-semibold">Your submission <Badge value={t.submission.reviewStatus} /></p>
                  {t.submission.feedback && <p className="text-ink-700"><b>Feedback:</b> {t.submission.feedback}</p>}
                </div>
              )}
              {t.status !== 'Completed' && (
                <div className="mt-4 flex gap-2">
                  {t.status === 'Pending' && <button className="btn-ghost" onClick={() => start(t)}>Start task</button>}
                  <button className="btn-primary" onClick={() => setSubmitting(t)}>{t.submission ? 'Update submission' : 'Submit work'}</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {submitting && <SubmitForm task={submitting} onClose={() => setSubmitting(null)} onSaved={() => { setSubmitting(null); load(); }} />}
    </>
  );
}
