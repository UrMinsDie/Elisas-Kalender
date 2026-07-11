# Installation für Anfänger

## Lokal

1. Node.js installieren.
2. Terminal im Projektordner `C:\Users\migue\Desktop\Elisas Kalender` öffnen.
3. `npm install` ausführen.
4. `.env.example` als `.env` kopieren.
5. `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` und `VITE_SITE_URL` eintragen.
6. `npm run dev` ausführen.

## Supabase

1. Neues Supabase-Projekt erstellen.
2. SQL Editor öffnen.
3. Vollständigen Inhalt von `supabase/schema.sql` einfügen und ausführen.
4. Optional `supabase/seed.sql` ausführen.
5. Unter Authentication einen Benutzer mit E-Mail und Passwort für Elisa anlegen.
6. Benutzer-ID kopieren.
7. Administratorin eintragen:

```sql
insert into public.admin_users (user_id)
values ('HIER-DIE-USER-UUID-EINTRAGEN');
```

8. Project URL kopieren.
9. Publishable Key kopieren.
10. Service-Role-Schlüssel nur für Netlify kopieren.
11. Auth Site URL und Redirect URLs für `http://localhost:5173` und die Netlify-Adresse konfigurieren.

## Netlify

1. Projekt zu GitHub hochladen oder über Netlify importieren.
2. Neues Netlify-Projekt erstellen.
3. Repository verbinden.
4. Build command: `npm run build`.
5. Publish directory: `dist`.
6. Functions directory: `netlify/functions`.
7. Umgebungsvariablen eintragen.
8. Deployment starten.
9. `VITE_SITE_URL` und `ALLOWED_ORIGIN` auf die echte Netlify-Adresse setzen.
10. Neu deployen.
11. Supabase Auth Redirect URL ergänzen.
12. Login und Gastanfrage testen.

| Variable | Netlify | lokale `.env` | öffentlich sichtbar | geheim |
| -------- | ------: | ------------: | ------------------: | -----: |
| `VITE_SUPABASE_URL` | ja | ja | ja | nein |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ja | ja | ja | nein |
| `VITE_SITE_URL` | ja | ja | ja | nein |
| `SUPABASE_URL` | ja | nein | nein | nein |
| `SUPABASE_SERVICE_ROLE_KEY` | ja | nein | nein | ja |
| `ALLOWED_ORIGIN` | ja | nein | nein | nein |
| `RESEND_API_KEY` | ja | nein | nein | ja |
| `MAIL_FROM` | ja | nein | nein | nein |
