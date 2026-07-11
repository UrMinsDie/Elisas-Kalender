import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import deLocale from '@fullcalendar/core/locales/de';
import { useNavigate } from 'react-router-dom';
import { getPublicCalendarEvents } from '../services/calendarService';
import { publicTitleFor } from '../lib/validation';
import type { PublicCalendarEvent } from '../types/calendar';

export function PublicCalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<PublicCalendarEvent[]>([]);
  const [error, setError] = useState('');

  async function loadEvents(start: Date, end: Date) {
    try {
      setError('');
      setEvents(await getPublicCalendarEvents(start, end));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kalenderdaten konnten nicht geladen werden.');
    }
  }

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <h1>Elisas Kalender</h1>
          <p>Freie Zeiten, vorläufige Anfragen und belegte Zeiträume auf einen Blick.</p>
        </div>
      </header>
      {error && <p className="alert">{error}</p>}
      <div className="legend">
        <span><i className="dot free" /> Frei</span>
        <span><i className="dot pending" /> Vorläufig angefragt</span>
        <span><i className="dot busy" /> Belegt</span>
        <span><i className="dot blocked" /> Nicht verfügbar</span>
      </div>
      <div className="calendar-surface">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={deLocale}
          timeZone="Europe/Berlin"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }}
          buttonText={{ today: 'Heute', month: 'Monat', week: 'Woche', list: 'Liste' }}
          height="auto"
          selectable
          datesSet={(info) => loadEvents(info.start, info.end)}
          dateClick={(info) => navigate(`/request?date=${info.dateStr.slice(0, 10)}`)}
          events={events.map((event) => ({
            id: event.id,
            title: publicTitleFor(event),
            start: event.start_at,
            end: event.end_at,
            className: `event-${event.public_status}`,
          }))}
        />
      </div>
    </main>
  );
}
