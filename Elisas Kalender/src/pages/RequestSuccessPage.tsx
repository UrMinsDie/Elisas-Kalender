import { Link } from 'react-router-dom';

export function RequestSuccessPage() {
  return (
    <main className="page narrow">
      <h1>Anfrage erhalten</h1>
      <p>Deine Anfrage wurde übermittelt. Der Termin ist noch nicht bestätigt. Du erhältst eine Rückmeldung, nachdem die Anfrage geprüft wurde.</p>
      <Link className="button" to="/calendar">Zurück zum Kalender</Link>
    </main>
  );
}
