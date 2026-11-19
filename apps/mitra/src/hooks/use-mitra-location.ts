import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';
import { useMitraAuth } from '@/context/MitraAuthContext';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const DEFAULT_COORDS: Coordinates = {
  latitude: -6.2088,
  longitude: 106.8456,
};

export function useMitraLocation() {
  const { session, user, barberDetails, refreshProfile } = useMitraAuth();
  const [isOnline, setIsOnline] = useState<boolean>(barberDetails?.is_online ?? false);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const watchSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (barberDetails) {
      setIsOnline(Boolean(barberDetails.is_online));
    }
  }, [barberDetails?.is_online]);

  const pushLocationToServer = useCallback(
    async (nextCoords: Coordinates, onlineState: boolean) => {
      if (!user) return;

      try {
        const token = session?.access_token;
        const response = await fetch(`${getApiBaseUrl()}/api/barbers/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            latitude: nextCoords.latitude,
            longitude: nextCoords.longitude,
            is_online: onlineState,
          }),
        });

        if (!response.ok) {
          // Fallback langsung ke Supabase table barber_details
          await supabase.from('barber_details').upsert(
            {
              profile_id: user.id,
              is_online: onlineState,
              current_location: `POINT(${nextCoords.longitude} ${nextCoords.latitude})`,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'profile_id' }
          );
        }

        setCoords(nextCoords);
        setLastSyncedAt(new Date());
      } catch {
        // Fallback jika backend lokal belum menyala
        await supabase.from('barber_details').upsert(
          {
            profile_id: user.id,
            is_online: onlineState,
            current_location: `POINT(${nextCoords.longitude} ${nextCoords.latitude})`,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'profile_id' }
        );
        setCoords(nextCoords);
        setLastSyncedAt(new Date());
      }
    },
    [session?.access_token, user]
  );

  const stopWatching = useCallback(() => {
    if (watchSubRef.current) {
      watchSubRef.current.remove();
      watchSubRef.current = null;
    }
  }, []);

  const startWatching = useCallback(async () => {
    stopWatching();
    setLocationError(null);

    if (Platform.OS === 'web') {
      await pushLocationToServer(DEFAULT_COORDS, true);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Izin lokasi diperlukan agar pelanggan sekitar dapat menemukan Anda.');
      // Tetap sinkronkan koordinat fallback agar status online bisa dites di emulator
      await pushLocationToServer(DEFAULT_COORDS, true);
      return;
    }

    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await pushLocationToServer(
        {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        },
        true
      );
    } catch {
      await pushLocationToServer(DEFAULT_COORDS, true);
    }

    try {
      watchSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 15,
        },
        (loc) => {
          pushLocationToServer(
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            },
            true
          );
        }
      );
    } catch (watchErr: any) {
      console.warn('[MitraLocation] Watch position failed:', watchErr?.message);
    }
  }, [pushLocationToServer, stopWatching]);

  useEffect(() => {
    if (isOnline && user) {
      startWatching();
    } else {
      stopWatching();
    }
    return () => stopWatching();
  }, [isOnline, user, startWatching, stopWatching]);

  const toggleOnline = useCallback(async () => {
    if (!user || isToggling) return;
    setIsToggling(true);
    setLocationError(null);

    const nextState = !isOnline;
    try {
      setIsOnline(nextState);
      if (!nextState) {
        stopWatching();
        await pushLocationToServer(coords ?? DEFAULT_COORDS, false);
      } else {
        await startWatching();
      }
      await refreshProfile();
    } finally {
      setIsToggling(false);
    }
  }, [user, isToggling, isOnline, stopWatching, pushLocationToServer, coords, startWatching, refreshProfile]);

  return {
    isOnline,
    coords,
    lastSyncedAt,
    isToggling,
    locationError,
    toggleOnline,
  };
}
