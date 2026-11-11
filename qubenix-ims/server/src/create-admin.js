// Creates (or resets the password of) the real admin account. Safe to run in production.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { supabase } from './config/db.js';
import { must } from './utils/db.js';

const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 10) {
  console.error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 10 characters in server/.env first.');
  process.exit(1);
}
const hash = await bcrypt.hash(password, 10);
const existing = must(await supabase.from('admins').select('id').eq('email', email).maybeSingle());
if (existing) must(await supabase.from('admins').update({ password: hash }).eq('id', existing.id));
else must(await supabase.from('admins').insert({ name: 'Admin', email, password: hash }));
console.log(`Admin ready: ${email}. You can now remove ADMIN_PASSWORD from .env.`);
