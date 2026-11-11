import { Router } from 'express';
import { supabase } from '../config/db.js';
import { protect, requireRole } from '../middleware/auth.js';
import { HttpError, TASK_SELECT, found, must, taskOut } from '../utils/db.js';

const router = Router();
router.use(protect);
const admin = requireRole('admin');
const intern = requireRole('intern');

/* ---------- Intern endpoints ---------- */
router.get('/my', intern, async (req, res) => {
  const rows = must(await supabase.from('tasks').select('*').eq('assigned_to', req.user.id).order('deadline'));
  res.json(rows.map(taskOut));
});

router.patch('/:id/status', intern, async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'In Progress'].includes(status))
    throw new HttpError(400, 'Interns can set Pending or In Progress. Submit work and wait for approval to complete a task.');
  const row = found(must(await supabase.from('tasks').update({ status })
    .eq('id', req.params.id).eq('assigned_to', req.user.id).select('*').maybeSingle()), 'Task not found');
  res.json(taskOut(row));
});

router.post('/:id/submit', intern, async (req, res) => {
  const { description, githubUrl = '', documentUrl = '' } = req.body;
  if (!description?.trim()) throw new HttpError(400, 'Add a short description of your work');
  const task = found(must(await supabase.from('tasks').select('*').eq('id', req.params.id).eq('assigned_to', req.user.id).maybeSingle()), 'Task not found');
  const now = new Date().toISOString();
  const row = must(await supabase.from('tasks').update({
    submission: { description: description.trim(), githubUrl, documentUrl, submittedAt: now, reviewStatus: 'Submitted', feedback: '' },
    submitted_at: now,
    status: task.status === 'Pending' ? 'In Progress' : task.status, // becomes Completed once approved
  }).eq('id', task.id).select('*').single());
  res.json(taskOut(row));
});

/* ---------- Admin endpoints ---------- */
router.get('/', admin, async (req, res) => {
  const { status, priority, assignedTo, hasSubmission } = req.query;
  let q = supabase.from('tasks').select(TASK_SELECT).order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (priority) q = q.eq('priority', priority);
  if (assignedTo) q = q.eq('assigned_to', assignedTo);
  if (hasSubmission === 'true') q = q.not('submission', 'is', null);
  res.json(must(await q).map(taskOut));
});

router.post('/', admin, async (req, res) => {
  const { title, description, assignedTo, deadline, priority, status } = req.body;
  const row = must(await supabase.from('tasks')
    .insert({ title, description, assigned_to: assignedTo, deadline, priority, status }).select(TASK_SELECT).single());
  res.status(201).json(taskOut(row));
});

router.put('/:id', admin, async (req, res) => {
  const { title, description, assignedTo, deadline, priority, status } = req.body;
  const row = found(must(await supabase.from('tasks')
    .update({ title, description, assigned_to: assignedTo, deadline, priority, status })
    .eq('id', req.params.id).select(TASK_SELECT).maybeSingle()), 'Task not found');
  res.json(taskOut(row));
});

router.patch('/:id/review', admin, async (req, res) => {
  const { reviewStatus, feedback = '' } = req.body;
  if (!['Submitted', 'Approved', 'Changes Requested'].includes(reviewStatus)) throw new HttpError(400, 'Invalid review status');
  const task = must(await supabase.from('tasks').select('id,submission').eq('id', req.params.id).maybeSingle());
  if (!task?.submission) throw new HttpError(404, 'No submission to review');
  const row = must(await supabase.from('tasks').update({
    submission: { ...task.submission, reviewStatus, feedback, reviewedAt: new Date().toISOString() },
    status: reviewStatus === 'Approved' ? 'Completed' : 'In Progress',
  }).eq('id', task.id).select(TASK_SELECT).single());
  res.json(taskOut(row));
});

router.delete('/:id', admin, async (req, res) => {
  const rows = must(await supabase.from('tasks').delete().eq('id', req.params.id).select('id'));
  found(rows[0], 'Task not found');
  res.json({ message: 'Task deleted' });
});

export default router;
