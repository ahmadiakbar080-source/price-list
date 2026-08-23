import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAuthUser(user: User | null): AuthUser | null {
  return user ? { id: user.id, email: user.email ?? undefined } : null;
}

/** Maps Supabase auth errors to safe, user-facing Persian messages. */
function mapAuthError(error: unknown): string {
  const err = error as { message?: string; code?: string };
  const msg = (err?.message ?? '').toLowerCase();
  if (msg.includes('invalid login credentials')) return 'ایمیل یا رمز عبور نادرست است.';
  if (msg.includes('email not confirmed')) return 'ایمیل شما تأیید نشده است.';
  if (msg.includes('too many requests') || err?.code === 'over_request_rate_limit')
    return 'تلاش‌های زیادی انجام شده است. چند لحظه بعد دوباره امتحان کنید.';
  return 'ورود ناموفق بود. لطفاً دوباره تلاش کنید.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      setUser(toAuthUser(data.session?.user ?? null));
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user ?? null));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(mapAuthError(error));
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}