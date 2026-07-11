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

grant execute on function public.update_admin_appointment(uuid, text, text, text, timestamptz, timestamptz, public.appointment_status, public.entry_type, public.visibility_type, text, text) to authenticated;
