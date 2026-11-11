import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate, toInputDate } from '../api';
import { Badge, Empty, ErrorMsg, Field, Modal, PageHead } from '../components/ui';

const blank = { name: '', email: '', phone: '', department: '', joiningDate: '', status: 'Active', password: '' };

function InternForm({ intern, onClose, onSaved }) {
  const [f, setF] = useState(intern ? { ...intern, joiningDate: toInputDate(intern.joiningDate), password: '' } : blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const saved = await api(intern ? `/interns/${intern._id}` : '/interns', { method: intern ? 'PUT' : 'POST', body: f });
      onSaved(saved);
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <Modal title={intern ? 'Edit intern' : 'Add intern'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ErrorMsg>{error}</ErrorMsg>
        <Field label="Full name"><input className="input" required value={f.name} onChange={set('name')} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email"><input className="input" type="email" required value={f.email} onChange={set('email')} /></Field>
          <Field label="Phone"><input className="input" required pattern="[0-9+\-\s]{7,15}" title="7 to 15 digits" value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Department"><input className="input" required placeholder="e.g. Frontend" value={f.department} onChange={set('department')} /></Field>
          <Field label="Joining date"><input className="input" type="date" required value={f.joiningDate} onChange={set('joiningDate')} /></Field>
          <Field label="Status">
            <select className="input" value={f.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select>
          </Field>
          <Field label={intern ? 'New password (optional)' : 'Login password'}>
            <input className="input" type="password" autoComplete="new-password" minLength={6} placeholder={intern ? 'Leave blank to keep' : 'Leave blank to generate one'} value={f.password} onChange={set('password')} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save intern'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Profile({ id, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api(`/interns/${id}`).then(setData).catch((e) => setError(e.message)); }, [id]);
  return (
    <Modal title="Intern profile" onClose={onClose}>
      {error ? <ErrorMsg>{error}</ErrorMsg> : !data ? <p className="text-ink-500">Loading…</p> : (
        <div className="space-y-5">
          <div>
            <p className="text-xl font-extrabold">{data.intern.name}</p>
            <p className="text-sm text-ink-500">{data.intern.department} · joined {fmtDate(data.intern.joiningDate)}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-ink-500">Email</dt><dd className="font-semibold break-all">{data.intern.email}</dd></div>
            <div><dt className="text-ink-500">Phone</dt><dd className="font-semibold">{data.intern.phone}</dd></div>
            <div><dt className="text-ink-500">Status</dt><dd><Badge value={data.intern.status} /></dd></div>
          </dl>
          <div>
            <h3 className="mb-2 font-bold">Assigned tasks ({data.tasks.length})</h3>
            {data.tasks.length === 0 ? <p className="text-sm text-ink-500">No tasks assigned yet.</p> : (
              <ul className="divide-y divide-ink-100 rounded-md border border-ink-100">
                {data.tasks.map((t) => (
                  <li key={t._id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span>{t.title} <span className="text-ink-500">· due {fmtDate(t.deadline)}</span></span><Badge value={t.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Interns() {
  const [interns, setInterns] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | intern
  const [viewing, setViewing] = useState(null);
  const [creds, setCreds] = useState(null); // shown once after creating an intern without a password
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const qs = new URLSearchParams({ ...(search && { search }), ...(status && { status }) });
    api(`/interns?${qs}`).then(setInterns).catch((e) => setError(e.message));
  }, [search, status]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const remove = async (i) => {
    if (!window.confirm(`Delete ${i.name}? Their tasks will be deleted too.`)) return;
    try { await api(`/interns/${i._id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <>
      <PageHead title="Interns" subtitle="Add, update and track everyone in the programme."
        action={<button className="btn-primary" onClick={() => setEditing('new')}>Add intern</button>} />
      <ErrorMsg>{error}</ErrorMsg>
      <div className="mb-4 mt-2 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name, email or department" aria-label="Search interns" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input w-40" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option><option>Active</option><option>Inactive</option>
        </select>
      </div>
      <div className="panel overflow-x-auto">
        {!interns ? <Empty>Loading…</Empty> : interns.length === 0 ? <Empty>No interns found. Add your first intern to get started.</Empty> : (
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-ink-100"><tr>
              {['Name', 'Department', 'Phone', 'Joined', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-ink-100">
              {interns.map((i) => (
                <tr key={i._id} className="hover:bg-ink-50">
                  <td className="td"><p className="font-semibold">{i.name}</p><p className="text-ink-500">{i.email}</p></td>
                  <td className="td">{i.department}</td>
                  <td className="td">{i.phone}</td>
                  <td className="td">{fmtDate(i.joiningDate)}</td>
                  <td className="td"><Badge value={i.status} /></td>
                  <td className="td">
                    <div className="flex justify-end gap-2">
                      <button className="btn-ghost" onClick={() => setViewing(i._id)}>View</button>
                      <button className="btn-ghost" onClick={() => setEditing(i)}>Edit</button>
                      <button className="btn-danger" onClick={() => remove(i)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editing && <InternForm intern={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={(saved) => { setEditing(null); load(); if (saved.tempPassword) setCreds(saved); }} />}
      {viewing && <Profile id={viewing} onClose={() => setViewing(null)} />}
      {creds && (
        <Modal title="Share these login details" onClose={() => setCreds(null)}>
          <p className="mb-3 text-sm">This password is shown only once. Send it to {creds.name} now.</p>
          <div className="rounded-md bg-ink-50 p-3 text-sm"><p>Email: <b>{creds.email}</b></p><p>Password: <b className="select-all">{creds.tempPassword}</b></p></div>
          <div className="mt-4 flex justify-end"><button className="btn-primary" onClick={() => setCreds(null)}>Done</button></div>
        </Modal>
      )}
    </>
  );
}
