import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main className="hero">
      <section>
        <p className="eyebrow">Persönlicher Terminkalender</p>
        <h1>Elisas Kalender</h1>
        <p>Hier siehst du, wann Elisa Zeit hat, und kannst unkompliziert ein Treffen anfragen.</p>
        <div className="actions">
          <Link className="button" to="/calendar">Kalender ansehen</Link>
          <Link className="button secondary" to="/request">Treffen anfragen</Link>
        </div>
        <p className="privacy">Deine Angaben werden nur zur Bearbeitung deiner Anfrage gespeichert.</p>
      </section>
    </main>
  );
}
