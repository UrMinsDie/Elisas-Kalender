# Supabase Setup

Führe zuerst `schema.sql` im SQL Editor aus. Danach kannst du optional `seed.sql` ausführen.

Die erste Administratorin wird in Supabase Authentication manuell angelegt. Danach ihre UUID kopieren und ausführen:

```sql
insert into public.admin_users (user_id)
values ('HIER-DIE-USER-UUID-EINTRAGEN');
```
