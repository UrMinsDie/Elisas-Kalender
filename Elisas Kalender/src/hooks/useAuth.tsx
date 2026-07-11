import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refreshAdminState(currentSession: Session | null) {
    if (!currentSession) {
      setIsAdmin(false);
      return;
    }
    const { data, error } = await supabase.rpc('is_admin');
    if (error || !data) {
      setIsAdmin(false);
      await supabase.auth.signOut();
      throw new Error('Dieser Login hat keinen Adminzugriff.');
    }
    setIsAdmin(true);
  }

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      try {
        await refreshAdminState(data.session);
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      refreshAdminState(newSession).catch(() => setSession(null));
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    session,
    isAdmin,
    loading,
    async signIn(email, password) {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        throw new Error('Anmeldung fehlgeschlagen. Bitte prüfe E-Mail und Passwort.');
      }
      setSession(data.session);
      await refreshAdminState(data.session);
      setLoading(false);
    },
    async signOut() {
      await supabase.auth.signOut();
      setSession(null);
      setIsAdmin(false);
    },
  }), [isAdmin, loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden.');
  return value;
}
