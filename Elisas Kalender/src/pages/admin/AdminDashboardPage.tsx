import { Link } from 'react-router-dom';
import { CalendarPlus, Inbox, Settings } from 'lucide-react';

export function AdminDashboardPage() {
  return (
    <>
      <h1>Übersicht</h1>
      <div className="stats">
        <article><strong>Offene Anfragen</strong><span>über Anfragen laden</span></article>
        <article><strong>Heute</strong><span>Termine im Kalender prüfen</span></article>
        <article><strong>Blockierungen</strong><span>unter Termine verwalten</span></article>
      </div>
      <div className="quick-actions">
        <Link className="button" to="/admin/appointments"><CalendarPlus size={18} /> Neuer Eintrag</Link>
        <Link className="button secondary" to="/admin/requests"><Inbox size={18} /> Offene Anfragen</Link>
        <Link className="button secondary" to="/admin/settings"><Settings size={18} /> Einstellungen</Link>
      </div>
    </>
  );
}
