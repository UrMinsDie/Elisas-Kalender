import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Lock } from 'lucide-react';
import { EnvNotice } from '../components/EnvNotice';
import { ThemeToggle } from '../components/ThemeToggle';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = location.pathname !== '/';

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          {canGoBack && (
            <button type="button" className="back-button" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} /> Zurück
            </button>
          )}
          <Link className="brand" to="/"><CalendarDays size={22} /> Elisas Kalender</Link>
        </div>
        <nav>
          <Link to="/calendar">Kalender</Link>
          <Link to="/request">Anfragen</Link>
          <Link className="admin-login-link" to="/login" aria-label="Elisa Login"><Lock size={18} /> Elisa Login</Link>
          <ThemeToggle />
        </nav>
      </header>
      <EnvNotice />
      <Outlet />
    </>
  );
}
