import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authStore.js';
import { Spinner } from './ui.jsx';
import { Gift } from './Icons.jsx';

function Booting() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="text-center">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-400 text-white shadow-glow">
          <Gift size={26} />
        </span>
        <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
          <Spinner size={15} className="text-rose-400" /> Getting things ready…
        </div>
      </div>
    </div>
  );
}

/**
 * Role gate for the three portals.
 *
 * A signed-in user of the wrong role is sent to their own home rather than the
 * login screen — bouncing a seller to /login when they are already signed in
 * reads as a bug.
 */
export function RequireRole({ role, redirectTo, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Booting />;

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location.pathname + location.search }} replace />;
  }

  if (user.role !== role) {
    const home = { CUSTOMER: '/', SELLER: '/seller', ADMIN: '/admin' }[user.role] || '/';
    return <Navigate to={home} replace />;
  }

  return children;
}

/** Keeps a signed-in user off the login/signup screens. */
export function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Booting />;
  if (!user) return children;

  const from = location.state?.from;
  const home = { CUSTOMER: '/', SELLER: '/seller', ADMIN: '/admin' }[user.role] || '/';
  return <Navigate to={from && user.role === 'CUSTOMER' ? from : home} replace />;
}

export { Booting };
