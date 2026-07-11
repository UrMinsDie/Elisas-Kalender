# Deployment

Netlify nutzt `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Die SPA-Weiterleitung sorgt dafür, dass `/login` und `/admin/calendar` nach einem Reload funktionieren.

In Netlify müssen diese Variablen gesetzt werden:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGIN`
- `RESEND_API_KEY` optional für E-Mail-Benachrichtigungen
- `MAIL_FROM` optional, zum Beispiel `Elisas Kalender <mail@deine-domain.de>`

`VITE_*` ist im Browser sichtbar. `SUPABASE_SERVICE_ROLE_KEY` ist streng geheim und nur für Netlify Functions bestimmt.
