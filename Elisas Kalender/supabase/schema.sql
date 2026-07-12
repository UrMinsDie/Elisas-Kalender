create extension if not exists pgcrypto;

create type public.appointment_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.entry_type as enum ('guest_request', 'admin_appointment', 'blocked_time');
create type public.visibility_type as enum ('busy_only', 'public_title', 'private');

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  guest_name text,
  guest_email text,
  title text not null,
  activity_type text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  entry_type public.entry_type not null default 'guest_request',
  visibility public.visibility_type not null default 'private',
  admin_note text,
  rejection_reason text,
  created_by uuid references auth.users(id),
  decided_by uuid references auth.users(id),
  decision_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_order check (end_at > start_at),
  constraint guest_request_requires_guest check (entry_type <> 'guest_request' or guest_name is not null)
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null unique check (weekday between 0 and 6),
  is_enabled boolean not null default true,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_time_order check (end_time > start_time)
);

create table public.app_settings (
  id integer primary key default 1 check (id = 1),
  site_title text not null default 'Elisas Kalender',
  owner_display_name text not null default 'Elisa',
  timezone text not null default 'Europe/Berlin',
  minimum_duration_minutes integer not null default 30 check (minimum_duration_minutes > 0),
  maximum_duration_minutes integer not null default 20160 check (maximum_duration_minutes >= minimum_duration_minutes),
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes > 0),
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  minimum_notice_hours integer not null default 2 check (minimum_notice_hours >= 0),
  maximum_advance_days integer not null default 120 check (maximum_advance_days > 0),
  pending_blocks_time boolean not null default true,
  privacy_policy_url text,
  contact_email text,
  primary_color text not null default '#2f6f73',
  free_color text not null default '#d9f99d',
  pending_color text not null default '#fde68a',
  busy_color text not null default '#93c5fd',
  blocked_color text not null default '#9ca3af',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.request_rate_limits (
  id uuid primary key default gen_random_uuid(),
  fingerprint_hash text not null,
  created_at timestamptz not null default now()
);

create index appointments_range_idx on public.appointments (start_at, end_at);
create index appointments_status_idx on public.appointments (status);
create index appointments_entry_type_idx on public.appointments (entry_type);
create index request_rate_limits_fingerprint_idx on public.request_rate_limits (fingerprint_hash, created_at);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger appointments_touch before update on public.appointments for each row execute function public.touch_updated_at();
create trigger availability_touch before update on public.availability_rules for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.app_settings for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.has_blocking_overlap(starts_at timestamptz, ends_at timestamptz, ignore_id uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.appointments a
    cross join public.app_settings s
    where (ignore_id is null or a.id <> ignore_id)
      and a.start_at < ends_at
      and a.end_at > starts_at
      and (
        a.status = 'approved'
        or a.entry_type in ('admin_appointment', 'blocked_time')
        or (a.status = 'pending' and s.pending_blocks_time)
      )
      and a.status not in ('rejected', 'cancelled')
  );
$$;

create or replace function public.get_public_calendar_events(range_start timestamptz, range_end timestamptz)
returns table (id text, start_at timestamptz, end_at timestamptz, public_status text, public_title text)
language sql stable security definer set search_path = public as $$
  select
    a.id::text,
    a.start_at,
    a.end_at,
    case
      when a.entry_type = 'blocked_time' then 'blocked'
      when a.status = 'pending' then 'pending'
      else 'busy'
    end,
    case
      when a.entry_type = 'guest_request' and a.status = 'pending' then concat('Anfrage: ', coalesce(a.guest_name, 'Gast'), ' - ', coalesce(nullif(a.title, ''), a.activity_type))
      when a.entry_type = 'guest_request' and a.status = 'approved' then concat(coalesce(nullif(a.title, ''), a.activity_type), ' - ', coalesce(a.guest_name, 'Gast'))
      when a.visibility = 'public_title' then a.title
      else null
    end
  from public.appointments a
  where range_end > range_start
    and range_end <= range_start + interval '120 days'
    and a.start_at < range_end
    and a.end_at > range_start
    and a.status not in ('rejected', 'cancelled');
$$;

create or replace function public.get_public_settings()
returns table (site_title text, owner_display_name text, timezone text, privacy_policy_url text, primary_color text, free_color text, pending_color text, busy_color text, blocked_color text)
language sql stable security definer set search_path = public as $$
  select site_title, owner_display_name, timezone, privacy_policy_url, primary_color, free_color, pending_color, busy_color, blocked_color
  from public.app_settings where id = 1;
$$;

create or replace function public.create_booking_request(guest_name_text text, guest_email_text text, activity_text text, title_text text, description_text text, starts_at timestamptz, ends_at timestamptz)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('elisas-calendar-bookings'));
  if ends_at <= starts_at then raise exception 'invalid_range'; end if;
  if public.has_blocking_overlap(starts_at, ends_at, null) then raise exception 'overlap'; end if;
  insert into public.appointments (guest_name, guest_email, title, activity_type, description, start_at, end_at, status, entry_type, visibility)
  values (left(guest_name_text, 120), nullif(left(trim(coalesce(guest_email_text, '')), 180), ''), left(title_text, 160), left(activity_text, 80), left(description_text, 1000), starts_at, ends_at, 'pending', 'guest_request', 'private')
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.decide_booking_request(appointment_id uuid, new_status public.appointment_status, rejection_reason_text text default null)
returns void language plpgsql security definer set search_path = public as $$
declare target public.appointments;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  perform pg_advisory_xact_lock(hashtext('elisas-calendar-bookings'));
  select * into target from public.appointments where id = appointment_id for update;
  if not found then raise exception 'not_found'; end if;
  if new_status = 'approved' and public.has_blocking_overlap(target.start_at, target.end_at, target.id) then raise exception 'overlap'; end if;
  update public.appointments
  set status = new_status, decided_by = auth.uid(), decision_at = now(), rejection_reason = rejection_reason_text
  where id = appointment_id;
end;
$$;

create or replace function public.create_admin_appointment(appointment_title text, activity text, details text, starts_at timestamptz, ends_at timestamptz, entry_kind public.entry_type, visibility_mode public.visibility_type, note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  perform pg_advisory_xact_lock(hashtext('elisas-calendar-bookings'));
  if ends_at <= starts_at then raise exception 'invalid_range'; end if;
  if public.has_blocking_overlap(starts_at, ends_at, null) then raise exception 'overlap'; end if;
  insert into public.appointments (title, activity_type, description, start_at, end_at, status, entry_type, visibility, admin_note, created_by)
  values (left(appointment_title, 160), left(activity, 80), left(details, 1000), starts_at, ends_at, 'approved', entry_kind, visibility_mode, left(note, 1000), auth.uid())
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.update_admin_appointment(appointment_id uuid, appointment_title text, activity text, details text, starts_at timestamptz, ends_at timestamptz, new_status public.appointment_status, entry_kind public.entry_type, visibility_mode public.visibility_type, note text, rejection_reason_text text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  perform pg_advisory_xact_lock(hashtext('elisas-calendar-bookings'));
  if ends_at <= starts_at then raise exception 'invalid_range'; end if;
  if new_status in ('pending', 'approved') and public.has_blocking_overlap(starts_at, ends_at, appointment_id) then raise exception 'overlap'; end if;
  update public.appointments
  set title = left(appointment_title, 160),
      activity_type = left(activity, 80),
      description = left(details, 1000),
      start_at = starts_at,
      end_at = ends_at,
      status = new_status,
      entry_type = entry_kind,
      visibility = visibility_mode,
      admin_note = left(note, 1000),
      rejection_reason = left(rejection_reason_text, 1000),
      decided_by = case when new_status in ('approved', 'rejected') then auth.uid() else decided_by end,
      decision_at = case when new_status in ('approved', 'rejected') then now() else decision_at end
  where id = appointment_id;
  if not found then raise exception 'not_found'; end if;
end;
$$;

alter table public.admin_users enable row level security;
alter table public.appointments enable row level security;
alter table public.availability_rules enable row level security;
alter table public.app_settings enable row level security;
alter table public.request_rate_limits enable row level security;

create policy "admins read admin users" on public.admin_users for select using (public.is_admin());
create policy "admins manage appointments" on public.appointments for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage availability" on public.availability_rules for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage settings" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update, delete on public.appointments, public.availability_rules, public.app_settings to authenticated;
grant select on public.admin_users to authenticated;
grant insert, select, delete on public.request_rate_limits to service_role;

revoke execute on all functions in schema public from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_public_calendar_events(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.get_public_settings() to anon, authenticated;
grant execute on function public.create_booking_request(text, text, text, text, text, timestamptz, timestamptz) to anon, authenticated, service_role;
grant execute on function public.decide_booking_request(uuid, public.appointment_status, text) to authenticated;
grant execute on function public.create_admin_appointment(text, text, text, timestamptz, timestamptz, public.entry_type, public.visibility_type, text) to authenticated;
grant execute on function public.update_admin_appointment(uuid, text, text, text, timestamptz, timestamptz, public.appointment_status, public.entry_type, public.visibility_type, text, text) to authenticated;

insert into public.app_settings (id, site_title, owner_display_name)
values (1, 'Elisas Kalender', 'Elisa')
on conflict (id) do nothing;
