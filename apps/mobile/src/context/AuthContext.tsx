import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    // 1. Ambil session awal saat app boot
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Auth] Error getting initial session:', error.message);
        }
        if (mounted) {
          if (initialSession && initialSession.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            setIsGuest(false);
          } else {
            setSession(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('[Auth] Unexpected error during init:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Berlangganan perubahan autentikasi Supabase secara real-time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (currentSession && currentSession.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        setIsGuest(false);
      } else {
        setSession(null);
        setUser(null);
      }

      if (event === 'SIGNED_OUT') {
        setIsGuest(false);
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginAsGuest = () => {
    setIsGuest(true);
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsGuest(false);
    } catch (err) {
      console.warn('[Auth] Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
      if (refreshedSession) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
      }
    } catch (err) {
      console.warn('[Auth] Failed to refresh session:', err);
    }
  };

  const isAuthenticated = useMemo(() => {
    if (!session || !user) return false;
    // Cek apakah token JWT belum kedaluwarsa
    if (session.expires_at) {
      const isExpired = Date.now() >= session.expires_at * 1000;
      if (isExpired) return false;
    }
    return true;
  }, [session, user]);

  const value = useMemo(
    () => ({
      session,
      user,
      isAuthenticated,
      isGuest,
      isLoading,
      loginAsGuest,
      signOut,
      refreshSession,
    }),
    [session, user, isAuthenticated, isGuest, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
