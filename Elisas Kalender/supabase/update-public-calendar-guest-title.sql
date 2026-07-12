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

grant execute on function public.get_public_calendar_events(timestamptz, timestamptz) to anon, authenticated;
