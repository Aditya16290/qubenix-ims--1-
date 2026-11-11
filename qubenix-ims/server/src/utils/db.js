// Helpers that keep the API responses in the same shape the React app already expects.
export const INTERN_COLS = 'id,name,email,phone,department,joining_date,status,created_at'; // no password
export const TASK_SELECT = '*, interns(id,name,email,department)';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const must = ({ data, error }) => { if (error) throw error; return data; };
export const found = (data, message) => { if (!data) throw new HttpError(404, message); return data; };

export const internOut = (r) => ({
  _id: r.id, name: r.name, email: r.email, phone: r.phone, department: r.department,
  joiningDate: r.joining_date, status: r.status, createdAt: r.created_at,
});

export const taskOut = (r) => ({
  _id: r.id, title: r.title, description: r.description,
  assignedTo: r.interns ? { _id: r.interns.id, name: r.interns.name, email: r.interns.email, department: r.interns.department } : r.assigned_to,
  deadline: r.deadline, priority: r.priority, status: r.status,
  submission: r.submission, createdAt: r.created_at,
});
