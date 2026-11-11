import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/db.js';
import { protect, signToken } from '../middleware/auth.js';
import { must } from '../utils/db.js';

const router = Router();

// POST /api/auth/login  { email, password, role: 'admin' | 'intern' }
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const role = req.body?.role ?? 'admin';
  if (!['admin', 'intern'].includes(role))
    return res.status(400).json({ message: 'Role must be admin or intern' });
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password)
    return res.status(400).json({ message: 'Email and password are required' });
  const isIntern = role === 'intern';
  const user = must(await supabase.from(isIntern ? 'interns' : 'admins')
    .select(isIntern ? 'id,name,email,password,status' : 'id,name,email,password')
    .eq('email', email.toLowerCase().trim()).maybeSingle());
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: 'Incorrect email or password' });
  if (isIntern && user.status === 'Inactive')
    return res.status(403).json({ message: 'This account is inactive. Contact your admin.' });
  res.json({ token: signToken(user.id, role), user: { id: user.id, name: user.name, email: user.email, role } });
});

router.get('/me', protect, async (req, res) => {
  const user = must(await supabase.from(req.user.role === 'intern' ? 'interns' : 'admins')
    .select('id,name,email').eq('id', req.user.id).maybeSingle());
  if (!user) return res.status(401).json({ message: 'Account no longer exists' });
  res.json({ ...user, role: req.user.role });
});

export default router;
