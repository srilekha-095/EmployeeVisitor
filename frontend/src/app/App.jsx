import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './AuthContext.jsx';
import VisitorList from './pages/VisitorList.jsx';
import VisitorForm from './pages/VisitorForm.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// Sends anonymous users to the login page
function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Sends already-logged-in users away from login / signup
function GuestOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="empty-state">
        <p className="empty-label">Loading…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/" element={<Protected><VisitorList /></Protected>} />
      <Route path="/new" element={<Protected><VisitorForm /></Protected>} />
      <Route path="/visitor/:id/edit" element={<Protected><VisitorForm /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
