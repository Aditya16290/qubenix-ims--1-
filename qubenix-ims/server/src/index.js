// Local development entry. On Vercel the app is served by /api/index.js instead.
import app from './app.js';
import { supabase } from './config/db.js';

const port = process.env.PORT || 5000;
app.listen(port, async () => {
  console.log(`API running on port ${port}`);
  const { error } = await supabase.from('admins').select('id', { head: true, count: 'exact' });
  console.log(error ? `Supabase check failed: ${error.message}. Did you run supabase/schema.sql?` : 'Supabase connected');
});
