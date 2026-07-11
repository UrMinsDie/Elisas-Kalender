# Manueller Testplan

1. Öffentlicher Gast sieht den Kalender.
2. Gast sieht keine privaten Details.
3. Gast stellt eine gültige Anfrage.
4. Ungültige E-Mail wird abgelehnt.
5. Honeypot-Anfrage wird abgelehnt.
6. Rate Limit funktioniert nach fünf Anfragen pro Stunde.
7. Anfrage erscheint im Adminbereich.
8. Nicht eingeloggter Benutzer kann Adminseiten nicht öffnen.
9. Eingeloggter Nicht-Admin erhält keinen Zugriff.
10. Admin nimmt eine Anfrage an.
11. Admin lehnt eine Anfrage ab.
12. Abgelehnter Zeitraum ist wieder frei.
13. Doppelbuchung wird verhindert.
14. Zwei fast gleichzeitige Anfragen werden sicher verarbeitet.
15. Admin erstellt einen privaten Termin.
16. Gast sieht bei diesem Termin nur „Belegt“.
17. Admin erstellt einen öffentlichen Termin.
18. Gast sieht nur den erlaubten öffentlichen Titel.
19. Admin erstellt eine Blockierung.
20. Blockierter Zeitraum ist nicht buchbar.
21. Kalender funktioniert auf Smartphone und Desktop.
22. Direkter Aufruf von `/admin/calendar` nach Neuladen funktioniert auf Netlify.
23. Service-Role-Schlüssel ist nicht im Browser-Bundle enthalten.
24. Öffentliche Supabase-Aufrufe geben keine persönlichen Daten zurück.
