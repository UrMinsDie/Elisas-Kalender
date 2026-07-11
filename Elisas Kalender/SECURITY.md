# Sicherheitsmodell

Öffentliche Besucher lesen keine vollständigen Zeilen aus `appointments`. Die öffentliche Kalenderansicht verwendet ausschließlich `get_public_calendar_events`, das nur Zeitraum, anonymisierten Status und bei ausdrücklich öffentlicher Sichtbarkeit den Titel zurückgibt.

Alle Tabellen haben Row Level Security. Vollständige Termine, Einstellungen und Verfügbarkeiten sind nur für Benutzer zugänglich, bei denen `public.is_admin()` wahr ist. Ein normal eingeloggter Benutzer ohne Eintrag in `admin_users` erhält keinen Adminzugriff.

Gastanfragen laufen über `netlify/functions/create-booking-request.ts`. Die Function validiert Eingaben, prüft Honeypot und Rate Limit, speichert nur einen Hash aus IP/User-Agent und verwendet den Service-Role-Schlüssel ausschließlich serverseitig.

Doppelbuchungen werden serverseitig verhindert. `create_booking_request`, `decide_booking_request` und `create_admin_appointment` nutzen eine PostgreSQL-Transaktion mit `pg_advisory_xact_lock` und prüfen Überschneidungen mit `bestehender Start < neuer Endzeitpunkt` und `bestehender Endzeitpunkt > neuer Startzeitpunkt`.

Keine echten Secrets gehören in das Repository oder in das Frontend. Browser-Code darf nur Supabase URL und Publishable Key verwenden.
