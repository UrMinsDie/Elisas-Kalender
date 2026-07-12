import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import deLocale from '@fullcalendar/core/locales/de';
import { Link } from 'react-router-dom';
import { getPublicCalendarEvents } from '../services/calendarService';
import { publicTitleFor } from '../lib/validation';
import type { PublicCalendarEvent } from '../types/calendar';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 720);

  useEffect(() => {
    function update() {
      setIsMobile(window.innerWidth < 720);
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return isMobile;
}

export function PublicCalendarPage() {
  const isMobile = useIsMobile();
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
        <Link className="button" to="/request">Treffen anfragen</Link>
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
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
          locale={deLocale}
          timeZone="Europe/Berlin"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: isMobile ? 'listWeek,dayGridMonth,timeGridDay' : 'dayGridMonth,timeGridWeek,listWeek',
          }}
          buttonText={{ today: 'Heute', month: 'Monat', week: 'Woche', list: 'Liste' }}
          height="auto"
          selectable={false}
          dayMaxEvents={isMobile ? 2 : 4}
          datesSet={(info) => loadEvents(info.start, info.end)}
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
