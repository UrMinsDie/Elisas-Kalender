import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { activities, validateBookingForm } from '../lib/validation';
import { createBookingRequest } from '../services/bookingService';
import type { BookingFormData } from '../types/calendar';

export function RequestPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<BookingFormData>({
    guestName: '',
    guestEmail: '',
    activityType: 'Treffen',
    customTitle: '',
    description: '',
    startDate: params.get('date') ?? '',
    endDate: params.get('date') ?? '',
    startTime: '',
    endTime: '',
    privacyAccepted: false,
    website: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const currentErrors = useMemo(() => errors, [errors]);

  function update<K extends keyof BookingFormData>(key: K, value: BookingFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function sendRequest() {
    if (submitting) return;
    const validationErrors = validateBookingForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setMessage(Object.values(validationErrors).join(' '));
      return;
    }
    setSubmitting(true);
    setMessage('Deine Anfrage wird gesendet...');
    try {
      await createBookingRequest(form);
      navigate('/request/success');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Die Anfrage konnte nicht gesendet werden.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await sendRequest();
  }

  return (
    <main className="page narrow">
      <h1>Treffen mit Elisa anfragen</h1>
      <form className="form" onSubmit={submit}>
        <label>Name<input value={form.guestName} onChange={(e) => update('guestName', e.target.value)} />{currentErrors.guestName && <small>{currentErrors.guestName}</small>}</label>
        <label>E-Mail<input type="email" value={form.guestEmail} onChange={(e) => update('guestEmail', e.target.value)} />{currentErrors.guestEmail && <small>{currentErrors.guestEmail}</small>}</label>
        <label>Aktivität<select value={form.activityType} onChange={(e) => update('activityType', e.target.value)}>{activities.map((activity) => <option key={activity}>{activity}</option>)}</select>{currentErrors.activityType && <small>{currentErrors.activityType}</small>}</label>
        {form.activityType === 'Sonstiges' && <label>Was möchtest du machen?<input value={form.customTitle} onChange={(e) => update('customTitle', e.target.value)} />{currentErrors.customTitle && <small>{currentErrors.customTitle}</small>}</label>}
        <label>Nachricht<textarea value={form.description} maxLength={1000} onChange={(e) => update('description', e.target.value)} /></label>
        <fieldset className="date-range">
          <legend>Zeitraum</legend>
          <div className="grid-two">
            <label>Von Datum<input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />{currentErrors.startDate && <small>{currentErrors.startDate}</small>}</label>
            <label>Von Uhrzeit<input type="time" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} />{currentErrors.startTime && <small>{currentErrors.startTime}</small>}</label>
            <label>Bis Datum<input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />{currentErrors.endDate && <small>{currentErrors.endDate}</small>}</label>
            <label>Bis Uhrzeit<input type="time" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} />{currentErrors.endTime && <small>{currentErrors.endTime}</small>}</label>
          </div>
        </fieldset>
        <label className="checkbox"><input type="checkbox" checked={form.privacyAccepted} onChange={(e) => update('privacyAccepted', e.target.checked)} /> Ich bin einverstanden, dass Name, E-Mail-Adresse, Termindaten und Nachricht zur Bearbeitung gespeichert werden.</label>
        {currentErrors.privacyAccepted && <small>{currentErrors.privacyAccepted}</small>}
        <input className="honeypot" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} />
        {message && <p className={message.includes('gesendet') ? 'hint' : 'alert'} role="status">{message}</p>}
        <button type="button" className="button" disabled={submitting} onClick={sendRequest}>{submitting ? 'Anfrage wird gesendet...' : 'Anfrage senden'}</button>
      </form>
    </main>
  );
}
