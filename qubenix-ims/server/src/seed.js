import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { supabase } from './config/db.js';
import { must } from './utils/db.js';

// Demo data only. This DELETES every admin, intern and task, so it refuses to run unless asked.
if (!process.argv.includes('--demo') || process.env.NODE_ENV === 'production') {
  console.error('Refusing to run: this wipes all data. For a real admin use "npm run create-admin". For local demo data use "npm run seed:demo".');
  process.exit(1);
}
const NONE = '00000000-0000-0000-0000-000000000000';
for (const t of ['tasks', 'interns', 'admins']) must(await supabase.from(t).delete().neq('id', NONE));

must(await supabase.from('admins').insert({
  name: 'Qubenix Admin', email: 'admin@qubenix.ai', password: await bcrypt.hash('Admin@123', 10),
}));

const pw = await bcrypt.hash('Intern@123', 10);
const interns = must(await supabase.from('interns').insert([
  { name: 'Aarav Sharma', email: 'aarav@example.com', phone: '9876543210', department: 'Frontend', joining_date: '2026-09-01', password: pw },
  { name: 'Diya Mehta', email: 'diya@example.com', phone: '9876501234', department: 'Backend', joining_date: '2026-09-08', password: pw },
  { name: 'Kabir Singh', email: 'kabir@example.com', phone: '9812345678', department: 'AI / ML', joining_date: '2026-08-15', status: 'Inactive', password: pw },
]).select('id'));

const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const now = new Date().toISOString();
must(await supabase.from('tasks').insert([
  { title: 'Build login page', description: 'React + Tailwind login screen with validation.', assigned_to: interns[0].id, deadline: inDays(3), priority: 'High', status: 'In Progress' },
  { title: 'Design REST API for orders', description: 'Express routes with a clean data layer.', assigned_to: interns[1].id, deadline: inDays(7), priority: 'Medium' },
  {
    title: 'Landing page clone', description: 'Pixel-match the provided Figma.', assigned_to: interns[0].id, deadline: inDays(-1), priority: 'Low', status: 'In Progress',
    submitted_at: now,
    submission: { description: 'Responsive clone, deployed on Vercel.', githubUrl: 'https://github.com/example/landing', documentUrl: '', submittedAt: now, reviewStatus: 'Submitted', feedback: '' },
  },
]));

console.log(`Demo data ready. Admin: admin@qubenix.ai / Admin@123  |  Intern: aarav@example.com / Intern@123`);
