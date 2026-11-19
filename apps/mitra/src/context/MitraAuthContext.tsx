import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { BarberDetails, Profile } from '@hometik/shared-types';
import { supabase } from '@/lib/supabase';

interface MitraAuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  barberDetails: BarberDetails | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const MitraAuthContext = createContext<MitraAuthContextValue>({
  session: null,
  user: null,
  profile: null,
  barberDetails: null,
  isLoading: true,
  isAuthenticated: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const MitraAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [barberDetails, setBarberDetails] = useState<BarberDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMitraProfile = useCallback(async (activeSession: Session | null) => {
    if (!activeSession?.user) {
      setProfile(null);
      setBarberDetails(null);
      return;
    }

    const userId = activeSession.user.id;

    const [{ data: profileData }, { data: barberData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('barber_details').select('*').eq('profile_id', userId).maybeSingle(),
    ]);

    if (profileData) {
      setProfile(profileData as Profile);
    } else {
      setProfile({
        id: userId,
        name: activeSession.user.user_metadata?.name || 'Mitra HomeTik',
        email: activeSession.user.email || null,
        phone: activeSession.user.user_metadata?.phone || '',
        role: activeSession.user.user_metadata?.role || 'BARBER',
        avatar_url: null,
      });
    }

    if (barberData) {
      setBarberDetails(barberData as BarberDetails);
    } else {
      setBarberDetails(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      await loadMitraProfile(initialSession);
      if (mounted) setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      await loadMitraProfile(nextSession);
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadMitraProfile]);

  const refreshProfile = useCallback(async () => {
    await loadMitraProfile(session);
  }, [loadMitraProfile, session]);

  const signOut = useCallback(async () => {
    if (session?.user) {
      // Pastikan status barber langsung di-set OFFLINE saat keluar
      await supabase
        .from('barber_details')
        .update({ is_online: false, updated_at: new Date().toISOString() })
        .eq('profile_id', session.user.id);
    }
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setBarberDetails(null);
  }, [session]);

  return (
    <MitraAuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        barberDetails,
        isLoading,
        isAuthenticated: Boolean(session?.user),
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </MitraAuthContext.Provider>
  );
};

export const useMitraAuth = () => useContext(MitraAuthContext);
