alter table public.appointments
  drop constraint if exists guest_request_requires_guest;

alter table public.appointments
  add constraint guest_request_requires_guest
  check (entry_type <> 'guest_request' or guest_name is not null);

create or replace function public.create_booking_request(guest_name_text text, guest_email_text text, activity_text text, title_text text, description_text text, starts_at timestamptz, ends_at timestamptz)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if ends_at <= starts_at then
    raise exception 'invalid time range';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.status in ('pending', 'approved')
      and a.start_at < ends_at
      and a.end_at > starts_at
      and (a.status = 'approved' or (select pending_blocks_time from public.app_settings where id = 1))
  ) then
    raise exception 'overlap';
  end if;

  insert into public.appointments (guest_name, guest_email, title, activity_type, description, start_at, end_at, status, entry_type, visibility)
  values (
    left(nullif(trim(guest_name_text), ''), 120),
    nullif(left(trim(coalesce(guest_email_text, '')), 180), ''),
    left(title_text, 160),
    left(activity_text, 80),
    left(description_text, 1000),
    starts_at,
    ends_at,
    'pending',
    'guest_request',
    'private'
  )
  returning id into new_id;

  return new_id;
end;
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

grant execute on function public.create_booking_request(text, text, text, text, text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.get_public_calendar_events(timestamptz, timestamptz) to anon, authenticated;
