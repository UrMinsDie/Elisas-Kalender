import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

export function RequestSuccessPage() {
  const location = useLocation();
  const state = location.state as { whatsappText?: string } | null;
  const whatsappText = state?.whatsappText ?? 'Hi Elisa, ich habe gerade eine Anfrage auf deiner Kalenderseite erstellt. Kannst du bitte darauf antworten?';
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <main className="page narrow">
      <h1>Anfrage erhalten</h1>
      <p>Deine Anfrage wurde übermittelt. Der Termin ist noch nicht bestätigt.</p>
      <div className="quick-actions">
        <a className="button" href={whatsappUrl} target="_blank" rel="noreferrer">Elisa per WhatsApp informieren</a>
        <Link className="button secondary" to="/calendar">Zurück zum Kalender</Link>
      </div>
      <p className="hint">WhatsApp öffnet sich mit einem fertigen Text. Du musst nur Elisa als Kontakt auswählen und senden.</p>
    </main>
  );
}
