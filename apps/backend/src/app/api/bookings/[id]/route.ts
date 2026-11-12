import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { updateBookingSchema } from '@/lib/validators/booking';
import type { ApiResponse, Booking } from '@hometik/shared-types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookings/[id]
 * Fetch a specific booking by ID with client & barber details
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clientForDb =
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-role-key'
        ? supabaseAdmin
        : supabase;

    const { data: booking, error } = await clientForDb
      .from('bookings')
      .select('*, user:profiles!bookings_user_id_fkey(*), barber:profiles!bookings_barber_id_fkey(*)')
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: error?.message ?? 'Booking tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: booking,
      error: null,
    });
  } catch (err) {
    console.error('[API] GET /api/bookings/[id] error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[id]
 * Update booking status or assign barber
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateBookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: validation.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, any> = {
      ...validation.data,
      updated_at: new Date().toISOString(),
    };

    if (validation.data.status === 'IN_PROGRESS') {
      updatePayload.started_at = new Date().toISOString();
    } else if (validation.data.status === 'COMPLETED') {
      updatePayload.completed_at = new Date().toISOString();
    }

    const clientForDb =
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-role-key'
        ? supabaseAdmin
        : supabase;

    const { data: updatedBooking, error: updateError } = await clientForDb
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select('*, user:profiles!bookings_user_id_fkey(*), barber:profiles!bookings_barber_id_fkey(*)')
      .single();

    if (updateError || !updatedBooking) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: updateError?.message ?? 'Gagal memperbarui pesanan' },
        { status: 500 }
      );
    }

    // Broadcast status change to realtime channel
    try {
      const channel = clientForDb.channel(`booking-${id}`);
      await channel.send({
        type: 'broadcast',
        event: 'booking_status_updated',
        payload: {
          bookingId: id,
          status: updatedBooking.status,
          barber_id: updatedBooking.barber_id,
          updated_at: updatedBooking.updated_at,
        },
      });
    } catch (realtimeErr) {
      console.warn('[Realtime] Failed to broadcast status update:', realtimeErr);
    }

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: updatedBooking,
      error: null,
    });
  } catch (err) {
    console.error('[API] PATCH /api/bookings/[id] error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
