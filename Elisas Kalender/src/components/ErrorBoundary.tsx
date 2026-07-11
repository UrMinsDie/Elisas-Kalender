import { Component, type ReactNode } from 'react';

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page narrow">
          <h1>Etwas ist schiefgelaufen</h1>
          <p>Bitte lade die Seite neu. Falls der Fehler bleibt, prüfe die Supabase-Konfiguration.</p>
        </main>
      );
    }
    return this.props.children;
  }
}
