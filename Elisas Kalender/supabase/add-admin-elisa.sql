insert into public.admin_users (user_id)
values ('443afc69-cfbb-4460-bb6b-b4c15c30cd79')
on conflict (user_id) do nothing;
