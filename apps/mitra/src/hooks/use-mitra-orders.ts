import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Booking, BookingStatus, Profile } from '@hometik/shared-types';
import { supabase } from '@/lib/supabase';
import { getApiBaseUrl } from '@/lib/api';
import { useMitraAuth } from '@/context/MitraAuthContext';

export interface MitraBooking extends Booking {
  user?: Profile | null;
}

export function useMitraOrders() {
  const { session, user } = useMitraAuth();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery<MitraBooking[]>({
    queryKey: ['mitra-orders', user?.id],
    enabled: Boolean(user?.id),
    refetchInterval: 15000,
    queryFn: async () => {
      if (!user?.id) return [];

      // Ambil pesanan milik barber ini + pesanan PENDING yang belum diambil barber lain
      const { data, error } = await supabase
        .from('bookings')
        .select('*, user:profiles!bookings_user_id_fkey(*)')
        .or(`barber_id.eq.${user.id},and(status.eq.PENDING,barber_id.is.null)`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('[MitraOrders] Fetch error:', error.message);
        return [];
      }

      return (data || []) as MitraBooking[];
    },
  });

  // Subscribe Supabase Realtime untuk pesanan baru & perubahan status secara instan
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`mitra-bookings-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mitra-orders', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
      assignSelf,
    }: {
      bookingId: string;
      status: BookingStatus;
      assignSelf?: boolean;
    }) => {
      if (!user?.id) throw new Error('Sesi mitra tidak valid');

      const bodyPayload: Record<string, any> = { status };
      if (assignSelf) {
        bodyPayload.barber_id = user.id;
      }

      const token = session?.access_token;
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(bodyPayload),
        });

        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch {
        // Fallback langsung ke Supabase
      }

      const updateFields: Record<string, any> = {
        ...bodyPayload,
        updated_at: new Date().toISOString(),
      };
      if (status === 'IN_PROGRESS') updateFields.started_at = new Date().toISOString();
      if (status === 'COMPLETED') updateFields.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('bookings')
        .update(updateFields)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mitra-orders', user?.id] });
    },
  });

  const allOrders = ordersQuery.data ?? [];

  const incomingOrders = allOrders.filter((b) => b.status === 'PENDING');
  const activeJob = allOrders.find((b) =>
    ['ACCEPTED', 'IN_TRANSIT', 'IN_PROGRESS'].includes(b.status)
  );
  const completedOrders = allOrders.filter((b) => b.status === 'COMPLETED');
  const cancelledOrders = allOrders.filter((b) => b.status === 'CANCELLED');

  // Hitung bagi hasil mitra 85% dari total pesanan selesai
  const totalGrossRevenue = completedOrders.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );
  const netPartnerEarnings = Math.round(totalGrossRevenue * 0.85);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEarnings = Math.round(
    completedOrders
      .filter((item) => (item.completed_at || item.updated_at || '').startsWith(todayStr))
      .reduce((sum, item) => sum + Number(item.total_price || 0), 0) * 0.85
  );

  return {
    allOrders,
    incomingOrders,
    activeJob,
    completedOrders,
    cancelledOrders,
    totalGrossRevenue,
    netPartnerEarnings,
    todayEarnings,
    isLoading: ordersQuery.isLoading,
    isRefetching: ordersQuery.isRefetching,
    refetch: ordersQuery.refetch,
    isUpdating: updateStatusMutation.isPending,
    acceptOrder: (bookingId: string) =>
      updateStatusMutation.mutateAsync({ bookingId, status: 'ACCEPTED', assignSelf: true }),
    rejectOrder: (bookingId: string) =>
      updateStatusMutation.mutateAsync({ bookingId, status: 'CANCELLED' }),
    updateOrderStatus: (bookingId: string, status: BookingStatus) =>
      updateStatusMutation.mutateAsync({ bookingId, status }),
  };
}
