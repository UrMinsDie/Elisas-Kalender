import { supabase } from '../lib/supabase';
import type { Appointment, AppointmentStatus, EntryType, PublicCalendarEvent, Visibility } from '../types/calendar';

export async function getPublicCalendarEvents(rangeStart: Date, rangeEnd: Date) {
  const { data, error } = await supabase.rpc('get_public_calendar_events', {
    range_start: rangeStart.toISOString(),
    range_end: rangeEnd.toISOString(),
  });
  if (error) throw new Error('Kalenderdaten konnten nicht geladen werden.');
  return (data ?? []) as PublicCalendarEvent[];
}

export async function getAdminAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('start_at', { ascending: true });
  if (error) throw new Error('Termine konnten nicht geladen werden.');
  return (data ?? []) as Appointment[];
}

export async function updateAppointmentStatus(id: string, status: 'approved' | 'rejected', rejectionReason?: string) {
  const { error } = await supabase.rpc('decide_booking_request', {
    appointment_id: id,
    new_status: status,
    rejection_reason_text: rejectionReason ?? null,
  });
  if (error) throw new Error(error.message.includes('overlap') ? 'Der Zeitraum ist inzwischen belegt.' : 'Die Anfrage konnte nicht aktualisiert werden.');
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw new Error('Der Eintrag konnte nicht gelöscht werden.');
}

export async function notifyBookingDecision(appointmentId: string, action: 'approved' | 'rejected' | 'deleted', rejectionReason?: string) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Für E-Mail-Benachrichtigungen ist ein Admin-Login nötig.');

  const response = await fetch('/.netlify/functions/notify-booking-decision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ appointmentId, action, rejectionReason }),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await response.json().catch(() => null) as { error?: string } | null
      : null;
    if (response.status === 404) {
      throw new Error('Die Netlify Function für E-Mails ist online nicht deployed. Bei Netlify reicht dafür nicht nur der dist-Ordner.');
    }
    throw new Error(body?.error ?? `E-Mail konnte nicht versendet werden. HTTP ${response.status}`);
  }

  return response.json() as Promise<{ sent: boolean; skipped?: boolean }>;
}

export interface AppointmentUpdateInput {
  id: string;
  title: string;
  activityType: string;
  description: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  entryType: EntryType;
  visibility: Visibility;
  adminNote: string;
  rejectionReason: string;
}

export async function updateAppointment(input: AppointmentUpdateInput) {
  const { error } = await supabase.rpc('update_admin_appointment', {
    appointment_id: input.id,
    appointment_title: input.title,
    activity: input.activityType,
    details: input.description,
    starts_at: input.startAt,
    ends_at: input.endAt,
    new_status: input.status,
    entry_kind: input.entryType,
    visibility_mode: input.visibility,
    note: input.adminNote,
    rejection_reason_text: input.rejectionReason,
  });
  if (error) {
    throw new Error(error.message.includes('overlap') ? 'Der Zeitraum überschneidet sich mit einem anderen blockierenden Eintrag.' : 'Der Eintrag konnte nicht gespeichert werden.');
  }
}
