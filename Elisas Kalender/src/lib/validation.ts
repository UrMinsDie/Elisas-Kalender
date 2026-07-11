import type { BookingFormData, PublicCalendarEvent } from '../types/calendar';

export const activities = [
  'Treffen',
  'Spazieren',
  'Essen gehen',
  'Filmabend',
  'Spieleabend',
  'Gemeinsam etwas unternehmen',
  'Sonstiges',
];

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

export function parseDateTime(date: string, time: string) {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function minutesBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function hasOverlap(start: Date, end: Date, events: Array<{ start_at: string; end_at: string }>) {
  return events.some((event) => new Date(event.start_at) < end && new Date(event.end_at) > start);
}

export function publicTitleFor(event: PublicCalendarEvent) {
  if (event.public_title) return event.public_title;
  if (event.public_status === 'pending') return 'Vorläufig angefragt';
  if (event.public_status === 'blocked') return 'Nicht verfügbar';
  if (event.public_status === 'busy') return 'Belegt';
  return 'Frei';
}

export function validateBookingForm(data: BookingFormData) {
  const errors: Record<string, string> = {};
  const start = parseDateTime(data.startDate, data.startTime);
  const end = parseDateTime(data.endDate, data.endTime);

  if (!data.guestName.trim()) errors.guestName = 'Bitte gib deinen Namen ein.';
  if (!isValidEmail(data.guestEmail)) errors.guestEmail = 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (!activities.includes(data.activityType)) errors.activityType = 'Bitte wähle eine Aktivität aus.';
  if (data.activityType === 'Sonstiges' && !data.customTitle.trim()) errors.customTitle = 'Bitte beschreibe die Aktivität kurz.';
  if (!data.startDate) errors.startDate = 'Bitte wähle ein Startdatum.';
  if (!data.endDate) errors.endDate = 'Bitte wähle ein Enddatum.';
  if (!start) errors.startTime = 'Bitte wähle einen gültigen Start.';
  if (!end) errors.endTime = 'Bitte wähle ein gültiges Ende.';
  if (start && end && end <= start) errors.endTime = 'Das Ende muss nach dem Start liegen.';
  if (start && end && minutesBetween(start, end) < 30) errors.endTime = 'Bitte plane mindestens 30 Minuten ein.';
  if (start && end && minutesBetween(start, end) > 60 * 24 * 14) errors.endTime = 'Bitte plane maximal 14 Tage ein.';
  if (!data.privacyAccepted) errors.privacyAccepted = 'Bitte bestätige den Datenschutzhinweis.';

  return errors;
}
