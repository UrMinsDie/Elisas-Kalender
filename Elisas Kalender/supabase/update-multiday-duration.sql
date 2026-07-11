update public.app_settings
set maximum_duration_minutes = 20160
where id = 1 and maximum_duration_minutes < 20160;
