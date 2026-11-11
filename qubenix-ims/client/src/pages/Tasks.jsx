import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate, toInputDate } from '../api';
import { Badge, Empty, ErrorMsg, Field, Modal, PageHead, isOverdue } from '../components/ui';

const blank = { title: '', description: '', assignedTo: '', deadline: '', priority: 'Medium', status: 'Pending' };

function TaskForm({ task, interns, onClose, onSaved }) {
  const [f, setF] = useState(task ? { ...task, assignedTo: task.assignedTo?._id || '', deadline: toInputDate(task.deadline) } : blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      await api(task ? `/tasks/${task._id}` : '/tasks', { method: task ? 'PUT' : 'POST', body: f });
      onSaved();
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <Modal title={task ? 'Edit task' : 'Create task'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ErrorMsg>{error}</ErrorMsg>
        <Field label="Title"><input className="input" required value={f.title} onChange={set('title')} /></Field>
        <Field label="Description"><textarea className="input min-h-[90px]" value={f.description} onChange={set('description')} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Assign to">
            <select className="input" required value={f.assignedTo} onChange={set('assignedTo')}>
              <option value="">Select intern</option>
              {interns.filter((i) => i.status === 'Active' || i._id === f.assignedTo).map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
            </select>
          </Field>
          <Field label="Deadline"><input className="input" type="date" required value={f.deadline} onChange={set('deadline')} /></Field>
          <Field label="Priority"><select className="input" value={f.priority} onChange={set('priority')}><option>Low</option><option>Medium</option><option>High</option></select></Field>
          <Field label="Status"><select className="input" value={f.status} onChange={set('status')}><option>Pending</option><option>In Progress</option><option>Completed</option></select></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save task'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState(null);
  const [interns, setInterns] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', assignedTo: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
    api(`/tasks?${qs}`).then(setTasks).catch((e) => setError(e.message));
  }, [filters]);
  useEffect(load, [load]);
  useEffect(() => { api('/interns').then(setInterns).catch(() => {}); }, []);

  const remove = async (t) => {
    if (!window.confirm(`Delete task “${t.title}”?`)) return;
    try { await api(`/tasks/${t._id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };
  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <>
      <PageHead title="Tasks" subtitle="Create work, set deadlines and priorities, and assign it to interns."
        action={<button className="btn-primary" onClick={() => setEditing('new')} disabled={interns.length === 0}>Create task</button>} />
      <ErrorMsg>{error}</ErrorMsg>
      <div className="mb-4 mt-2 flex flex-wrap gap-3">
        <select className="input w-44" aria-label="Filter by status" value={filters.status} onChange={setFilter('status')}>
          <option value="">All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option></select>
        <select className="input w-44" aria-label="Filter by priority" value={filters.priority} onChange={setFilter('priority')}>
          <option value="">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select>
        <select className="input w-52" aria-label="Filter by intern" value={filters.assignedTo} onChange={setFilter('assignedTo')}>
          <option value="">All interns</option>{interns.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}</select>
      </div>
      <div className="panel overflow-x-auto">
        {!tasks ? <Empty>Loading…</Empty> : tasks.length === 0 ? <Empty>No tasks match. Create a task and assign it to an intern.</Empty> : (
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-ink-100"><tr>{['Task', 'Assigned to', 'Deadline', 'Priority', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-ink-100">
              {tasks.map((t) => (
                <tr key={t._id} className="hover:bg-ink-50">
                  <td className="td"><p className="font-semibold">{t.title}</p>{t.submission && <p className="text-xs font-semibold text-volt-600">Submission: {t.submission.reviewStatus}</p>}</td>
                  <td className="td">{t.assignedTo?.name || <span className="text-ink-500">Removed</span>}</td>
                  <td className="td">{fmtDate(t.deadline)} {isOverdue(t) && <span className="ml-1 text-xs font-semibold text-red-600">Overdue</span>}</td>
                  <td className="td"><Badge value={t.priority} /></td>
                  <td className="td"><Badge value={t.status} /></td>
                  <td className="td"><div className="flex justify-end gap-2">
                    <button className="btn-ghost" onClick={() => setEditing(t)}>Edit</button>
                    <button className="btn-danger" onClick={() => remove(t)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editing && <TaskForm task={editing === 'new' ? null : editing} interns={interns} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
}
