import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { getAdminAppointments } from '../../services/calendarService';
import type { Appointment } from '../../types/calendar';

function adminEventTitle(item: Appointment) {
  if (item.entry_type === 'guest_request') {
    const guest = item.guest_name?.trim() || 'Unbekannter Gast';
    return `${guest}: ${item.activity_type || item.title}`;
  }
  if (item.entry_type === 'blocked_time') return `Blockiert: ${item.title}`;
  return item.title;
}

export function AdminCalendarPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);

  useEffect(() => {
    getAdminAppointments().then(setItems).catch(console.error);
  }, []);

  return (
    <>
      <h1>Admin-Kalender</h1>
      <div className="calendar-surface">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={deLocale}
          timeZone="Europe/Berlin"
          height="auto"
          editable
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }}
          events={items.map((item) => ({ id: item.id, title: adminEventTitle(item), start: item.start_at, end: item.end_at, className: `admin-${item.status} ${item.entry_type}` }))}
          eventClick={(info) => setSelected(items.find((item) => item.id === info.event.id) ?? null)}
        />
      </div>
      {selected && (
        <section className="detail-panel">
          <button className="ghost close" onClick={() => setSelected(null)}>Schließen</button>
          <h2>{adminEventTitle(selected)}</h2>
          {selected.entry_type === 'guest_request' && (
            <div className="guest-box">
              <strong>Anfrage von {selected.guest_name ?? 'unbekannt'}</strong>
              <span>{selected.guest_email ?? 'Keine E-Mail angegeben'}</span>
            </div>
          )}
          <p><strong>Titel:</strong> {selected.title}</p>
          <p><strong>Aktivität:</strong> {selected.activity_type}</p>
          <p><strong>Zeitraum:</strong> {new Date(selected.start_at).toLocaleString('de-DE')} bis {new Date(selected.end_at).toLocaleString('de-DE')}</p>
          <p><strong>Nachricht:</strong> {selected.description ?? '-'}</p>
          <p><strong>Status:</strong> {selected.status} | <strong>Sichtbarkeit:</strong> {selected.visibility}</p>
          <p><strong>Interne Notiz:</strong> {selected.admin_note ?? '-'}</p>
          <p><strong>Ablehnungsgrund:</strong> {selected.rejection_reason ?? '-'}</p>
        </section>
      )}
    </>
  );
}
