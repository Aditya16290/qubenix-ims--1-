import { Router } from 'express';
import { supabase } from '../config/db.js';
import { protect, requireRole } from '../middleware/auth.js';
import { TASK_SELECT, must, taskOut } from '../utils/db.js';

const router = Router();

const count = async (table, filter = (q) => q) => {
  const { count: n, error } = await filter(supabase.from(table).select('id', { count: 'exact', head: true }));
  if (error) throw error;
  return n ?? 0;
};

router.get('/stats', protect, requireRole('admin'), async (req, res) => {
  const [totalInterns, activeInterns, totalTasks, completedTasks, pendingTasks, inProgressTasks, awaitingReview, recent] =
    await Promise.all([
      count('interns'),
      count('interns', (q) => q.eq('status', 'Active')),
      count('tasks'),
      count('tasks', (q) => q.eq('status', 'Completed')),
      count('tasks', (q) => q.eq('status', 'Pending')),
      count('tasks', (q) => q.eq('status', 'In Progress')),
      count('tasks', (q) => q.eq('submission->>reviewStatus', 'Submitted')),
      supabase.from('tasks').select(TASK_SELECT).not('submission', 'is', null)
        .order('submitted_at', { ascending: false }).limit(5).then(must),
    ]);
  res.json({ totalInterns, activeInterns, totalTasks, completedTasks, pendingTasks, inProgressTasks, awaitingReview, recent: recent.map(taskOut) });
});

export default router;
