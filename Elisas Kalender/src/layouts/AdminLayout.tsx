import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from '../components/ThemeToggle';

const links = [
  ['/admin', 'Übersicht'],
  ['/admin/requests', 'Anfragen'],
  ['/admin/calendar', 'Kalender'],
  ['/admin/appointments', 'Termine'],
  ['/admin/settings', 'Einstellungen'],
];

export function AdminLayout() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  return (
    <main className="admin-shell">
      <aside className="admin-nav">
        <h2>Elisa</h2>
        {links.map(([href, label]) => (
          <Link key={href} className={pathname === href ? 'active' : ''} to={href}>{label}</Link>
        ))}
        <ThemeToggle />
        <button type="button" className="ghost" onClick={signOut}><LogOut size={16} /> Abmelden</button>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </main>
  );
}
