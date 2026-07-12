import { useEffect, useState } from 'react';
import { deleteAppointment, getAdminAppointments, updateAppointmentStatus } from '../../services/calendarService';
import type { Appointment } from '../../types/calendar';

function formatRange(item: Appointment) {
  return `${new Date(item.start_at).toLocaleString('de-DE')} bis ${new Date(item.end_at).toLocaleString('de-DE')}`;
}

function decisionText(item: Appointment, action: 'approved' | 'rejected' | 'deleted') {
  const greeting = item.guest_name ? `Hi ${item.guest_name},` : 'Hi,';
  const range = formatRange(item);

  if (action === 'approved') {
    return `${greeting} deine Anfrage "${item.title}" bei Elisa wurde angenommen. Zeitraum: ${range}.`;
  }

  if (action === 'rejected') {
    const reason = item.rejection_reason ? ` Grund: ${item.rejection_reason}` : '';
    return `${greeting} deine Anfrage "${item.title}" bei Elisa wurde leider abgelehnt.${reason}`;
  }

  return `${greeting} deine Anfrage "${item.title}" bei Elisa wurde gelöscht und findet nicht statt.`;
}

function openWhatsapp(item: Appointment, action?: 'approved' | 'rejected' | 'deleted') {
  const decision = action ?? (item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : undefined);
  if (!decision) return;
  const url = `https://wa.me/?text=${encodeURIComponent(decisionText(item, decision))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

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
      await load();
      setMessage((status === 'approved' ? 'Anfrage angenommen.' : 'Anfrage abgelehnt.') + ' Bitte informiere den Gast jetzt per WhatsApp-Button.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Aktion fehlgeschlagen.');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Diesen Datensatz wirklich löschen?')) return;
    const item = items.find((entry) => entry.id === id);
    if (item && window.confirm('Vor dem Löschen WhatsApp-Text für den Gast öffnen?')) {
      openWhatsapp(item, 'deleted');
    }
    await deleteAppointment(id);
    await load();
    setMessage('Anfrage gelöscht. Falls nötig, wurde der WhatsApp-Text vorbereitet.');
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
                  {(item.status === 'approved' || item.status === 'rejected') && (
                    <button onClick={() => openWhatsapp(item)}>Gast über WhatsApp informieren</button>
                  )}
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
