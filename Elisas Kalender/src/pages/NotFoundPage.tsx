import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="page narrow">
      <h1>Seite nicht gefunden</h1>
      <p>Diese Adresse gibt es in Elisas Kalender nicht.</p>
      <Link className="button" to="/">Zur Startseite</Link>
    </main>
  );
}
