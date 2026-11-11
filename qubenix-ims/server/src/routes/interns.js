import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { supabase } from '../config/db.js';
import { protect, requireRole } from '../middleware/auth.js';
import { INTERN_COLS, found, internOut, must, taskOut } from '../utils/db.js';

const router = Router();
router.use(protect, requireRole('admin'));


router.get('/', async (req, res) => {
  const { search, status } = req.query;
  let q = supabase.from('interns').select(INTERN_COLS).order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (search) {
    const s = search.replace(/[,()%*\\]/g, ' ').trim(); // keep the filter string safe
    if (s) q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,department.ilike.%${s}%`);
  }
  res.json(must(await q).map(internOut));
});

router.get('/:id', async (req, res) => {
  const intern = found(must(await supabase.from('interns').select(INTERN_COLS).eq('id', req.params.id).maybeSingle()), 'Intern not found');
  const tasks = must(await supabase.from('tasks').select('*').eq('assigned_to', intern.id).order('deadline'));
  res.json({ intern: internOut(intern), tasks: tasks.map(taskOut) });
});

router.post('/', async (req, res) => {
  const { name, email, phone, department, joiningDate, status, password } = req.body;
  // No default password: if the admin does not set one, generate a random one and show it once
  const plain = password || randomBytes(9).toString('base64url');
  const row = must(await supabase.from('interns').insert({
    name, email: email?.toLowerCase().trim(), phone, department, joining_date: joiningDate, status,
    password: await bcrypt.hash(plain, 10),
  }).select(INTERN_COLS).single());
  res.status(201).json({ ...internOut(row), ...(password ? {} : { tempPassword: plain }) });
});

router.put('/:id', async (req, res) => {
  const { name, email, phone, department, joiningDate, status, password } = req.body;
  const update = { name, email: email?.toLowerCase().trim(), phone, department, joining_date: joiningDate, status };
  if (password) update.password = await bcrypt.hash(password, 10);
  const row = found(must(await supabase.from('interns').update(update).eq('id', req.params.id).select(INTERN_COLS).maybeSingle()), 'Intern not found');
  res.json(internOut(row));
});

router.delete('/:id', async (req, res) => {
  // tasks.assigned_to has ON DELETE CASCADE, so their tasks go with them
  const rows = must(await supabase.from('interns').delete().eq('id', req.params.id).select('id'));
  found(rows[0], 'Intern not found');
  res.json({ message: 'Intern and their tasks deleted' });
});

export default router;
