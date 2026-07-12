import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { deleteAppointment, getAdminAppointments, updateAppointment } from '../../services/calendarService';
import { appointmentStatusLabels } from '../../types/calendar';
import type { Appointment, AppointmentStatus, EntryType, Visibility } from '../../types/calendar';

interface EditForm {
  id: string;
  title: string;
  activityType: string;
  description: string;
  startDate: string;
  endDate: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  entryType: EntryType;
  visibility: Visibility;
  adminNote: string;
  rejectionReason: string;
}

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function toTimeInput(value: string) {
  return new Date(value).toTimeString().slice(0, 5);
}

function toEditForm(item: Appointment): EditForm {
  return {
    id: item.id,
    title: item.title,
    activityType: item.activity_type,
    description: item.description ?? '',
    startDate: toDateInput(item.start_at),
    endDate: toDateInput(item.end_at),
    start: toTimeInput(item.start_at),
    end: toTimeInput(item.end_at),
    status: item.status,
    entryType: item.entry_type,
    visibility: item.visibility,
    adminNote: item.admin_note ?? '',
    rejectionReason: item.rejection_reason ?? '',
  };
}

function entrySummary(item: Appointment) {
  if (item.entry_type === 'guest_request') {
    return `Gastanfrage von ${item.guest_name ?? 'unbekannt'}`;
  }
  return item.entry_type === 'blocked_time' ? 'Blockierung' : 'Eigener Termin';
}

export function AdminAppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    const appointments = await getAdminAppointments();
    setItems(appointments);
  }

  useEffect(() => {
    load().catch((error: Error) => setMessage(error.message));
  }, []);

  async function createBlockedTime(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const { error } = await supabase.rpc('create_admin_appointment', {
      appointment_title: String(data.get('title')),
      activity: String(data.get('entry_type')),
      details: String(data.get('description') ?? ''),
      starts_at: new Date(`${data.get('start_date')}T${data.get('start')}:00`).toISOString(),
      ends_at: new Date(`${data.get('end_date')}T${data.get('end')}:00`).toISOString(),
      entry_kind: String(data.get('entry_type')),
      visibility_mode: String(data.get('visibility')),
      note: String(data.get('admin_note') ?? ''),
    });
    setMessage(error ? 'Eintrag konnte nicht erstellt werden. Prüfe, ob der Zeitraum frei ist.' : 'Eintrag erstellt.');
    if (!error) {
      event.currentTarget.reset();
      await load();
    }
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    try {
      await updateAppointment({
        id: editing.id,
        title: editing.title,
        activityType: editing.activityType,
        description: editing.description,
        startAt: new Date(`${editing.startDate}T${editing.start}:00`).toISOString(),
        endAt: new Date(`${editing.endDate}T${editing.end}:00`).toISOString(),
        status: editing.status,
        entryType: editing.entryType,
        visibility: editing.visibility,
        adminNote: editing.adminNote,
        rejectionReason: editing.rejectionReason,
      });
      setMessage('Eintrag gespeichert.');
      setEditing(null);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Der Eintrag konnte nicht gespeichert werden.');
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Diesen Eintrag wirklich dauerhaft löschen?')) return;
    try {
      await deleteAppointment(id);
      setMessage('Eintrag gelöscht.');
      if (editing?.id === id) setEditing(null);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Der Eintrag konnte nicht gelöscht werden.');
    }
  }

  return (
    <>
      <div className="page-head settings-head">
        <div>
          <p className="eyebrow">Adminbereich</p>
          <h1>Alle Einträge verwalten</h1>
          <p>Hier kann Elisa Gastanfragen, eigene Termine und blockierte Zeiten bearbeiten oder löschen.</p>
        </div>
      </div>

      {message && <p className={message.includes('nicht') || message.includes('überschneidet') ? 'alert' : 'success'}>{message}</p>}

      <section className="settings-section">
        <div>
          <h2>Neuen Eintrag erstellen</h2>
          <p>Für eigene Termine oder Zeiträume, in denen Elisa nicht verfügbar ist.</p>
        </div>
        <form className="settings-fields" onSubmit={createBlockedTime}>
          <label>Titel<input name="title" required /></label>
          <label>Art<select name="entry_type"><option value="admin_appointment">Eigener Termin</option><option value="blocked_time">Blockierung</option></select></label>
          <label>Sichtbarkeit<select name="visibility"><option value="private">Privat</option><option value="busy_only">Nur belegt</option><option value="public_title">Öffentlicher Titel</option></select></label>
          <fieldset className="date-range span-two">
            <legend>Zeitraum</legend>
            <div className="grid-two">
              <label>Von Datum<input type="date" name="start_date" required /></label>
              <label>Von Uhrzeit<input type="time" name="start" required /></label>
              <label>Bis Datum<input type="date" name="end_date" required /></label>
              <label>Bis Uhrzeit<input type="time" name="end" required /></label>
            </div>
          </fieldset>
          <label className="span-two">Beschreibung<textarea name="description" /></label>
          <label className="span-two">Interne Notiz<textarea name="admin_note" /></label>
          <button className="button span-two">Eintrag erstellen</button>
        </form>
      </section>

      <section className="settings-section">
        <div>
          <h2>Vorhandene Einträge</h2>
          <p>Auch Gastanfragen können hier nachträglich korrigiert oder entfernt werden.</p>
        </div>
        <div className="entry-list">
          {items.length === 0 && <p className="empty">Noch keine Einträge vorhanden.</p>}
          {items.map((item) => (
            <article className="entry-row" key={item.id}>
              <div>
                <strong>{item.entry_type === 'guest_request' ? `${item.guest_name ?? 'Unbekannter Gast'}: ${item.activity_type}` : item.title}</strong>
                <span>{new Date(item.start_at).toLocaleString('de-DE')} bis {new Date(item.end_at).toLocaleString('de-DE')}</span>
                <span>{entrySummary(item)} · {appointmentStatusLabels[item.status]}</span>
                {item.description && <span>Nachricht: {item.description}</span>}
              </div>
              <div className="row-actions">
                <button type="button" className="ghost" onClick={() => setEditing(toEditForm(item))}>Bearbeiten</button>
                <button type="button" onClick={() => remove(item.id)}>Löschen</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editing && (
        <section className="settings-section edit-panel">
          <div>
            <h2>Eintrag bearbeiten</h2>
            <p>Änderungen am Zeitraum werden serverseitig auf Überschneidungen geprüft.</p>
          </div>
          <form className="settings-fields" onSubmit={saveEdit}>
            <label>Titel<input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} required /></label>
            <label>Aktivität<input value={editing.activityType} onChange={(event) => setEditing({ ...editing, activityType: event.target.value })} required /></label>
            <label>Art
              <select value={editing.entryType} onChange={(event) => setEditing({ ...editing, entryType: event.target.value as EntryType })}>
                <option value="guest_request">Gastanfrage</option>
                <option value="admin_appointment">Eigener Termin</option>
                <option value="blocked_time">Blockierung</option>
              </select>
            </label>
            <label>Status
              <select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as AppointmentStatus })}>
                <option value="pending">Offen</option>
                <option value="approved">Angenommen</option>
                <option value="rejected">Abgelehnt</option>
                <option value="cancelled">Storniert</option>
              </select>
            </label>
            <label>Sichtbarkeit
              <select value={editing.visibility} onChange={(event) => setEditing({ ...editing, visibility: event.target.value as Visibility })}>
                <option value="private">Privat</option>
                <option value="busy_only">Nur belegt</option>
                <option value="public_title">Öffentlicher Titel</option>
              </select>
            </label>
            <fieldset className="date-range span-two">
              <legend>Zeitraum</legend>
              <div className="grid-two">
                <label>Von Datum<input type="date" value={editing.startDate} onChange={(event) => setEditing({ ...editing, startDate: event.target.value })} required /></label>
                <label>Von Uhrzeit<input type="time" value={editing.start} onChange={(event) => setEditing({ ...editing, start: event.target.value })} required /></label>
                <label>Bis Datum<input type="date" value={editing.endDate} onChange={(event) => setEditing({ ...editing, endDate: event.target.value })} required /></label>
                <label>Bis Uhrzeit<input type="time" value={editing.end} onChange={(event) => setEditing({ ...editing, end: event.target.value })} required /></label>
              </div>
            </fieldset>
            <label className="span-two">Beschreibung<textarea value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label>
            <label className="span-two">Interne Notiz<textarea value={editing.adminNote} onChange={(event) => setEditing({ ...editing, adminNote: event.target.value })} /></label>
            <label className="span-two">Ablehnungsgrund<textarea value={editing.rejectionReason} onChange={(event) => setEditing({ ...editing, rejectionReason: event.target.value })} /></label>
            <div className="row-actions span-two">
              <button className="button">Änderungen speichern</button>
              <button type="button" className="ghost" onClick={() => setEditing(null)}>Abbrechen</button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
