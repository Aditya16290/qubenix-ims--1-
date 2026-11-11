import 'dotenv/config';
import 'express-async-errors'; // lets async route handlers throw into the error middleware (Express 4)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import internRoutes from './routes/interns.js';
import taskRoutes from './routes/tasks.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
app.set('trust proxy', 1); // behind Vercel/Render proxies, so rate limiting sees real client IPs
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true }));
app.use(express.json({ limit: '100kb' }));

// Slow down password guessing: 10 login attempts per 15 minutes per IP
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again in a few minutes.' } }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/interns', internRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Central error handler: HttpError and Postgres error codes become readable messages
const PG_ERRORS = {
  '23505': [409, 'This email is already in use'],
  '23502': [400, 'A required field is missing'],
  '23514': [400, 'One of the values is not allowed'],
  '23503': [400, 'The related record was not found'],
  '22P02': [400, 'Invalid ID or value'],
  '22007': [400, 'Invalid date'],
  '22008': [400, 'Invalid date'],
};
app.use((err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (PG_ERRORS[err.code]) return res.status(PG_ERRORS[err.code][0]).json({ message: PG_ERRORS[err.code][1] });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

export default app;
