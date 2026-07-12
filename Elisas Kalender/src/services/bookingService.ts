import type { BookingFormData } from '../types/calendar';
import { supabase } from '../lib/supabase';
import { parseDateTime } from '../lib/validation';

export async function createBookingRequest(form: BookingFormData) {
  await createBookingRequestDirectly(form);
}

async function createBookingRequestDirectly(form: BookingFormData) {
  const start = parseDateTime(form.startDate, form.startTime);
  const end = parseDateTime(form.endDate, form.endTime);
  if (!start || !end) throw new Error('Bitte prüfe Datum und Uhrzeit.');

  const { error } = await supabase.rpc('create_booking_request', {
    guest_name_text: form.guestName,
    guest_email_text: '',
    activity_text: form.activityType,
    title_text: form.customTitle || form.activityType,
    description_text: form.description,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
  });

  if (error?.message.includes('overlap')) throw new Error('Dieser Zeitraum ist leider inzwischen nicht mehr verfügbar. Bitte wähle einen anderen Termin.');
  if (error) {
    throw new Error(`Die Anfrage konnte nicht gesendet werden. Supabase meldet: ${error.message}`);
  }
}
