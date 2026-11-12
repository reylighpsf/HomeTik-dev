import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Booking, NearbyBarber } from '@hometik/shared-types';

export interface DispatchResult {
  success: boolean;
  notifiedBarbers: number;
  bookingId: string;
}

/**
 * Real-Time Dispatching Engine
 * Finds nearby barbers and sends real-time notifications via Supabase Realtime
 */
export class DispatchingService {
  private static readonly DEFAULT_RADIUS_KM = 5.0;
  private static readonly MAX_RADIUS_KM = 15.0;
  private static readonly NOTIFICATION_CHANNEL = 'barber-notifications';

  /**
   * Find nearby online barbers using PostGIS spatial query
   */
  static async findNearbyBarbers(
    latitude: number,
    longitude: number,
    radiusKm: number = this.DEFAULT_RADIUS_KM
  ): Promise<NearbyBarber[]> {
    const { data, error } = await supabaseAdmin.rpc('find_nearby_barbers', {
      user_lat: latitude,
      user_lng: longitude,
      radius_km: Math.min(radiusKm, this.MAX_RADIUS_KM),
    });

    if (error) {
      console.warn('[Dispatching] Warning finding nearby barbers (RPC might not be installed yet):', error.message);
      return [];
    }

    return (data as NearbyBarber[]) ?? [];
  }

  /**
   * Dispatch a booking to nearby barbers via Supabase Realtime
   * Sends WebSocket notifications to all online barbers within radius
   */
  static async dispatchBooking(booking: Booking): Promise<DispatchResult> {
    const { latitude, longitude } = booking.user_location;

    // Find nearby barbers
    const nearbyBarbers = await this.findNearbyBarbers(latitude, longitude);

    if (nearbyBarbers.length === 0) {
      console.warn('[Dispatching] No nearby barbers found for booking:', booking.id);
      return {
        success: false,
        notifiedBarbers: 0,
        bookingId: booking.id,
      };
    }

    // Send real-time notification to each nearby barber via Supabase Realtime channel
    const channel = supabaseAdmin.channel(this.NOTIFICATION_CHANNEL);

    const notificationPayload = {
      type: 'NEW_BOOKING_REQUEST' as const,
      booking: {
        id: booking.id,
        service_type: booking.service_type,
        total_price: booking.total_price,
        user_location: booking.user_location,
        notes: booking.notes,
        scheduled_at: booking.scheduled_at,
        created_at: booking.created_at,
      },
      nearby_barber_ids: nearbyBarbers.map((b) => b.profile_id),
      timestamp: new Date().toISOString(),
    };

    await channel.send({
      type: 'broadcast',
      event: 'new_booking',
      payload: notificationPayload,
    });

    // Also insert notification records for persistence
    const notifications = nearbyBarbers.map((barber) => ({
      barber_profile_id: barber.profile_id,
      booking_id: booking.id,
      distance_km: barber.distance_km,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    }));

    await supabaseAdmin.from('booking_notifications').insert(notifications);

    console.log(
      `[Dispatching] Notified ${nearbyBarbers.length} barbers for booking ${booking.id}`
    );

    return {
      success: true,
      notifiedBarbers: nearbyBarbers.length,
      bookingId: booking.id,
    };
  }

  /**
   * Update booking status and notify relevant parties
   */
  static async updateBookingStatus(
    bookingId: string,
    status: Booking['status'],
    barberId?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = { status };

    if (barberId) {
      updateData.barber_id = barberId;
    }

    if (status === 'IN_PROGRESS') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'COMPLETED') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (error) {
      throw new Error(`Failed to update booking status: ${error.message}`);
    }

    // Broadcast status update
    const channel = supabaseAdmin.channel(`booking-${bookingId}`);
    await channel.send({
      type: 'broadcast',
      event: 'status_update',
      payload: { bookingId, status, barberId },
    });
  }
}
