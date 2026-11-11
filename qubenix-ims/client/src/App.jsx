import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Interns from './pages/Interns';
import Tasks from './pages/Tasks';
import Submissions from './pages/Submissions';
import MyTasks from './pages/MyTasks';

function Guard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-ink-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/' : '/my-tasks'} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/' : '/my-tasks'} replace /> : <Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Guard role="admin"><Dashboard /></Guard>} />
        <Route path="/interns" element={<Guard role="admin"><Interns /></Guard>} />
        <Route path="/tasks" element={<Guard role="admin"><Tasks /></Guard>} />
        <Route path="/submissions" element={<Guard role="admin"><Submissions /></Guard>} />
        <Route path="/my-tasks" element={<Guard role="intern"><MyTasks /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
