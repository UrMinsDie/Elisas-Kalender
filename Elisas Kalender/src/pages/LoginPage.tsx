import { FormEvent, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CalendarDays, LockKeyhole } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signIn, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung nicht möglich.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-intro">
          <span className="login-icon"><LockKeyhole size={26} /></span>
          <p className="eyebrow">Geschützter Bereich</p>
          <h1>Elisa Login</h1>
          <p>Hier kann Elisa Anfragen ansehen, Termine verwalten und freie Zeiten einstellen.</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label>E-Mail-Adresse
            <input
              type="email"
              autoComplete="email"
              placeholder="elisa@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>Passwort
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Passwort eingeben"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="alert">{error}</p>}
          <button className="button" disabled={loading}>{loading ? 'Elisa wird angemeldet...' : 'Als Elisa anmelden'}</button>
          <Link className="button secondary login-secondary" to="/calendar"><CalendarDays size={18} /> Zur öffentlichen Ansicht</Link>
        </form>
      </section>
    </main>
  );
}
