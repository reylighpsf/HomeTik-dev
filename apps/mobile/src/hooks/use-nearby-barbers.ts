import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';
import { TOP_BARBERS, BarberItem } from '@/constants/mock-data';
import type { ApiResponse, NearbyBarber } from '@hometik/shared-types';

export interface NearbyBarberOption extends BarberItem {
  profileId: string;
  isOnline: boolean;
  etaText: string;
}

const NEARBY_BARBERS_KEY = ['nearby-barbers'] as const;

export function useNearbyBarbers(latitude: number = -7.2656, longitude: number = 112.7483, radiusKm: number = 10) {
  return useQuery({
    queryKey: [...NEARBY_BARBERS_KEY, { latitude, longitude, radiusKm }],
    queryFn: async (): Promise<NearbyBarberOption[]> => {
      try {
        const apiUrl = getApiBaseUrl();
        const res = await fetch(`${apiUrl}/api/barbers/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const result: ApiResponse<NearbyBarber[]> = await res.json();
          if (result.success && result.data && result.data.length > 0) {
            return result.data.map((b) => ({
              id: b.id,
              profileId: b.profile_id,
              name: b.user_name || 'Mitra Barber',
              avatarUrl: b.user_avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
              rating: Number(b.rating) || 4.9,
              reviewsCount: b.total_reviews || 120,
              specialty: b.specialties?.[0] || 'Master Barber',
              distanceKm: Number(b.distance_km?.toFixed(1)) || 1.5,
              etaMinutes: Math.round((b.distance_km || 1.5) * 4) + 6,
              price: 85000,
              badge: 'SIAGA ONLINE',
              isOnline: b.is_online,
              isAvailable: b.is_online,
              etaText: `${Math.round((b.distance_km || 1.5) * 4) + 6} mnt`,
            }));
          }
        }
      } catch (err) {
        // Fallback to local active barbers data
      }

      // Fallback fallback online barbers from mock data
      return TOP_BARBERS.map((barber) => ({
        ...barber,
        profileId: `barber-${barber.id}`,
        isOnline: true,
        etaText: `${barber.etaMinutes || 10} mnt`,
      }));
    },
    staleTime: 1000 * 30, // 30 seconds fresh
  });
}
