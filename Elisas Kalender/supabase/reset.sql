-- WARNUNG: Diese Datei löscht alle von Elisas Kalender angelegten Daten, Tabellen, Funktionen und Typen.
drop function if exists public.create_admin_appointment(text, text, text, timestamptz, timestamptz, public.entry_type, public.visibility_type, text);
drop function if exists public.update_admin_appointment(uuid, text, text, text, timestamptz, timestamptz, public.appointment_status, public.entry_type, public.visibility_type, text, text);
drop function if exists public.decide_booking_request(uuid, public.appointment_status, text);
drop function if exists public.create_booking_request(text, text, text, text, text, timestamptz, timestamptz);
drop function if exists public.get_public_settings();
drop function if exists public.get_public_calendar_events(timestamptz, timestamptz);
drop function if exists public.has_blocking_overlap(timestamptz, timestamptz, uuid);
drop function if exists public.is_admin();
drop function if exists public.touch_updated_at();
drop table if exists public.request_rate_limits;
drop table if exists public.app_settings;
drop table if exists public.availability_rules;
drop table if exists public.appointments;
drop table if exists public.admin_users;
drop type if exists public.visibility_type;
drop type if exists public.entry_type;
drop type if exists public.appointment_status;
