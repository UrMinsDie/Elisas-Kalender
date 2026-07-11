import { useEffect, useState } from 'react';
import { deleteAppointment, getAdminAppointments, notifyBookingDecision, updateAppointmentStatus } from '../../services/calendarService';
import type { Appointment } from '../../types/calendar';

export function AdminRequestsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const appointments = await getAdminAppointments();
    setItems(appointments.filter((item) => item.entry_type === 'guest_request'));
  }

  useEffect(() => {
    load().catch((err: Error) => setMessage(err.message));
  }, []);

  async function decide(id: string, status: 'approved' | 'rejected') {
    const reason = status === 'rejected' ? window.prompt('Ablehnungsgrund optional') ?? undefined : undefined;
    try {
      await updateAppointmentStatus(id, status, reason);
      let mailNote = '';
      try {
        const result = await notifyBookingDecision(id, status, reason);
        mailNote = result.skipped ? ' E-Mail ist vorbereitet, aber noch kein Mail-Anbieter konfiguriert.' : ' Gast wurde per E-Mail informiert.';
      } catch (mailError) {
        mailNote = ` Hinweis: ${mailError instanceof Error ? mailError.message : 'E-Mail konnte nicht gesendet werden.'}`;
      }
      await load();
      setMessage((status === 'approved' ? 'Anfrage angenommen.' : 'Anfrage abgelehnt.') + mailNote);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Aktion fehlgeschlagen.');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Diesen Datensatz wirklich löschen?')) return;
    let mailNote = '';
    try {
      const result = await notifyBookingDecision(id, 'deleted');
      mailNote = result.skipped ? ' E-Mail ist vorbereitet, aber noch kein Mail-Anbieter konfiguriert.' : ' Gast wurde per E-Mail informiert.';
    } catch (mailError) {
      mailNote = ` Hinweis: ${mailError instanceof Error ? mailError.message : 'E-Mail konnte nicht gesendet werden.'}`;
    }
    await deleteAppointment(id);
    await load();
    setMessage('Anfrage gelöscht.' + mailNote);
  }

  return (
    <>
      <h1>Offene Anfragen</h1>
      {message && <p className="alert">{message}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Wer?</th><th>Kontakt</th><th>Wunsch</th><th>Nachricht</th><th>Zeitraum</th><th>Status</th><th>Aktionen</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.guest_name}</td>
                <td>{item.guest_email}</td>
                <td><strong>{item.activity_type}</strong><br />{item.title}</td>
                <td>{item.description || '-'}</td>
                <td>{new Date(item.start_at).toLocaleString('de-DE')}<br />bis {new Date(item.end_at).toLocaleString('de-DE')}</td>
                <td>{item.status}</td>
                <td className="row-actions">
                  <button onClick={() => decide(item.id, 'approved')}>Annehmen</button>
                  <button onClick={() => decide(item.id, 'rejected')}>Ablehnen</button>
                  <button onClick={() => remove(item.id)}>Löschen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
