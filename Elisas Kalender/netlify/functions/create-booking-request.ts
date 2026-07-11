import type { Handler } from '@netlify/functions';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const MAX_LENGTHS = { guestName: 120, guestEmail: 180, activityType: 80, customTitle: 160, description: 1000 };

function json(statusCode: number, body: unknown, origin: string) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function trim(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export const handler: Handler = async (event) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';
  const requestOrigin = event.headers.origin ?? '';
  const corsOrigin = requestOrigin === allowedOrigin || requestOrigin.startsWith('http://localhost:') ? requestOrigin : allowedOrigin;

  if (event.httpMethod === 'OPTIONS') return json(204, {}, corsOrigin);
  if (event.httpMethod !== 'POST') return json(405, { error: 'Methode nicht erlaubt.' }, corsOrigin);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: 'Server nicht konfiguriert.' }, corsOrigin);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(event.body ?? '{}') as Record<string, unknown>;
  } catch {
    return json(400, { error: 'Ungültiges JSON.' }, corsOrigin);
  }

  if (trim(payload.website, 200)) return json(400, { error: 'Anfrage abgelehnt.' }, corsOrigin);

  const guestName = trim(payload.guestName, MAX_LENGTHS.guestName);
  const guestEmail = trim(payload.guestEmail, MAX_LENGTHS.guestEmail).toLowerCase();
  const activityType = trim(payload.activityType, MAX_LENGTHS.activityType);
  const customTitle = trim(payload.customTitle, MAX_LENGTHS.customTitle);
  const description = trim(payload.description, MAX_LENGTHS.description);
  const startDate = trim(payload.startDate ?? payload.date, 10);
  const endDate = trim(payload.endDate ?? payload.date, 10);
  const startTime = trim(payload.startTime, 5);
  const endTime = trim(payload.endTime, 5);

  if (!guestName || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(guestEmail) || !activityType) return json(400, { error: 'Bitte prüfe deine Angaben.' }, corsOrigin);
  if (activityType === 'Sonstiges' && !customTitle) return json(400, { error: 'Bitte beschreibe die Aktivität.' }, corsOrigin);

  const start = new Date(`${startDate}T${startTime}:00`);
  const end = new Date(`${endDate}T${endTime}:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return json(400, { error: 'Ungültiger Zeitraum.' }, corsOrigin);
  if (end.getTime() - start.getTime() > 14 * 24 * 60 * 60 * 1000) return json(400, { error: 'Der Zeitraum ist zu lang.' }, corsOrigin);

  const ip = event.headers['x-forwarded-for']?.split(',')[0] ?? 'unknown';
  const userAgent = event.headers['user-agent'] ?? 'unknown';
  const fingerprint = createHash('sha256').update(`${ip}|${userAgent}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 12)}`).digest('hex');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  await supabase.from('request_rate_limits').delete().lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
  const { count } = await supabase.from('request_rate_limits').select('id', { count: 'exact', head: true }).eq('fingerprint_hash', fingerprint).gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if ((count ?? 0) >= 5) return json(429, { error: 'Zu viele Anfragen.' }, corsOrigin);
  await supabase.from('request_rate_limits').insert({ fingerprint_hash: fingerprint });

  const { error } = await supabase.rpc('create_booking_request', {
    guest_name_text: guestName,
    guest_email_text: guestEmail,
    activity_text: activityType,
    title_text: customTitle || activityType,
    description_text: description,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
  });

  if (error?.message.includes('overlap')) return json(409, { error: 'Zeitraum nicht verfügbar.' }, corsOrigin);
  if (error) return json(400, { error: 'Anfrage konnte nicht erstellt werden.' }, corsOrigin);
  return json(201, { ok: true }, corsOrigin);
};
