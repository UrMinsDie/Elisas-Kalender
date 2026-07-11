insert into public.app_settings (id, site_title, owner_display_name, timezone, minimum_duration_minutes, maximum_duration_minutes, slot_interval_minutes, buffer_minutes, minimum_notice_hours, maximum_advance_days, pending_blocks_time, contact_email)
values (1, 'Elisas Kalender', 'Elisa', 'Europe/Berlin', 30, 20160, 30, 0, 2, 120, true, null)
on conflict (id) do update set site_title = excluded.site_title, owner_display_name = excluded.owner_display_name;

insert into public.availability_rules (weekday, is_enabled, start_time, end_time) values
(1, true, '10:00', '20:00'),
(2, true, '10:00', '20:00'),
(3, true, '10:00', '20:00'),
(4, true, '10:00', '20:00'),
(5, true, '10:00', '20:00'),
(6, true, '12:00', '22:00'),
(0, false, '10:00', '20:00')
on conflict (weekday) do update set is_enabled = excluded.is_enabled, start_time = excluded.start_time, end_time = excluded.end_time;
