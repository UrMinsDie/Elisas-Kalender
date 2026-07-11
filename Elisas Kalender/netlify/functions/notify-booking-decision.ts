import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

type DecisionAction = 'approved' | 'rejected' | 'deleted';

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  });
  return `${formatter.format(new Date(start))} bis ${formatter.format(new Date(end))}`;
}

function subjectFor(action: DecisionAction) {
  if (action === 'approved') return 'Deine Anfrage wurde angenommen';
  if (action === 'rejected') return 'Deine Anfrage wurde abgelehnt';
  return 'Deine Anfrage wurde gelöscht';
}

function textFor(action: DecisionAction, appointment: Record<string, string | null>, rejectionReason?: string) {
  const name = appointment.guest_name || 'du';
  const range = formatDateRange(String(appointment.start_at), String(appointment.end_at));
  const title = appointment.title || appointment.activity_type || 'deine Anfrage';

  if (action === 'approved') {
    return `Hallo ${name},\n\nElisa hat deine Anfrage angenommen.\n\nTermin: ${title}\nZeitraum: ${range}\n\nLiebe Grüße\nElisas Kalender`;
  }
  if (action === 'rejected') {
    const reason = rejectionReason || appointment.rejection_reason;
    return `Hallo ${name},\n\nElisa hat deine Anfrage leider abgelehnt.\n\nAnfrage: ${title}\nZeitraum: ${range}${reason ? `\nGrund: ${reason}` : ''}\n\nLiebe Grüße\nElisas Kalender`;
  }
  return `Hallo ${name},\n\nElisa hat deine Anfrage gelöscht.\n\nAnfrage: ${title}\nZeitraum: ${range}\n\nLiebe Grüße\nElisas Kalender`;
}

async function sendResendEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: true };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Elisas Kalender <onboarding@resend.dev>',
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const providerError = await response.text().catch(() => '');
    throw new Error(providerError || 'Mail-Anbieter hat die E-Mail abgelehnt.');
  }
  return { skipped: false };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Methode nicht erlaubt.' });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: 'Server ist noch nicht vollständig konfiguriert.' });
  }

  const token = event.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'Nicht angemeldet.' });

  let body: { appointmentId?: string; action?: DecisionAction; rejectionReason?: string };
  try {
    body = JSON.parse(event.body || '{}') as typeof body;
  } catch {
    return json(400, { error: 'Ungültige Anfrage.' });
  }

  if (!body.appointmentId || !body.action || !['approved', 'rejected', 'deleted'].includes(body.action)) {
    return json(400, { error: 'Ungültige Benachrichtigung.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: userResult, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userResult.user) return json(401, { error: 'Sitzung ist ungültig.' });

  const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', userResult.user.id).single();
  if (!admin) return json(403, { error: 'Kein Adminzugriff.' });

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('guest_name, guest_email, title, activity_type, start_at, end_at, rejection_reason')
    .eq('id', body.appointmentId)
    .single();

  if (appointmentError || !appointment) return json(404, { error: 'Anfrage wurde nicht gefunden.' });
  if (!appointment.guest_email) return json(200, { sent: false, skipped: true, reason: 'Keine E-Mail-Adresse vorhanden.' });

  try {
    const result = await sendResendEmail(
      appointment.guest_email,
      subjectFor(body.action),
      textFor(body.action, appointment, body.rejectionReason),
    );
    return json(200, { sent: !result.skipped, skipped: result.skipped });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unbekannter Mailfehler';
    return json(502, { error: `E-Mail konnte nicht gesendet werden: ${detail}` });
  }
};
