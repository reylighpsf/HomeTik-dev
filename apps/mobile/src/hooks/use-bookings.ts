import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';
import type { Booking, CreateBookingPayload, ApiResponse } from '@hometik/shared-types';

const BOOKINGS_KEY = ['bookings'] as const;

export function useBookings(status?: string) {
  return useQuery({
    queryKey: [...BOOKINGS_KEY, { status }],
    queryFn: async (): Promise<Booking[]> => {
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Booking[];
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBookingPayload): Promise<Booking> => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error('Not authenticated');

      const apiUrl = getApiBaseUrl();
      const response = await fetch(
        `${apiUrl}/api/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result: ApiResponse<Booking> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Failed to create booking');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
    },
  });
}
