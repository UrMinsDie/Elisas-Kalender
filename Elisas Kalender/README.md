# Elisas Kalender

Eine React/TypeScript-Web-App, mit der Gäste anonymisierte freie und belegte Zeiten sehen und Treffen mit Elisa anfragen können. Elisa verwaltet Anfragen, eigene Termine, Blockierungen und Einstellungen im geschützten Adminbereich.

## Lokal starten

```bash
npm install
cp .env.example .env
npm run dev
```

Danach Supabase-Werte in `.env` eintragen.

## Wichtige Dateien

- `src/` enthält die React-App.
- `netlify/functions/create-booking-request.ts` nimmt öffentliche Gastanfragen sicher entgegen.
- `supabase/schema.sql` erstellt Tabellen, RLS-Policies und RPC-Funktionen.
- `supabase/seed.sql` setzt Elisa-Defaults und Verfügbarkeiten.

E-Mail-Benachrichtigungen laufen über `netlify/functions/notify-booking-decision.ts`. Ohne `RESEND_API_KEY` werden Entscheidungen gespeichert, aber der Mailversand wird übersprungen. Mit Resend müssen `RESEND_API_KEY` und optional `MAIL_FROM` in Netlify gesetzt werden.
