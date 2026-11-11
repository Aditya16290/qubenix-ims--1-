import { useEffect } from 'react';

const BADGE = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-ink-50 text-ink-500 border-ink-100',
  High: 'bg-red-50 text-red-700 border-red-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-ink-50 text-ink-500 border-ink-100',
  Submitted: 'bg-volt-100 text-volt-600 border-volt-100',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Changes Requested': 'bg-red-50 text-red-700 border-red-200',
};

export const Badge = ({ value }) => (
  <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE[value] || BADGE.Low}`}>{value}</span>
);

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`my-8 w-full rounded-lg bg-white shadow-xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-xl leading-none text-ink-500 hover:bg-ink-50">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const Field = ({ label, children }) => (
  <label className="block"><span className="label">{label}</span>{children}</label>
);

export const ErrorMsg = ({ children }) =>
  children ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p> : null;

export const Empty = ({ children }) => <p className="px-4 py-10 text-center text-sm text-ink-500">{children}</p>;

export const PageHead = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const isOverdue = (t) => t.status !== 'Completed' && new Date(t.deadline) < new Date();
