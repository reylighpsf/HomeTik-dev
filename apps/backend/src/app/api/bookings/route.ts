import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createBookingSchema } from '@/lib/validators/booking';
import { DispatchingService } from '@/services/dispatching.service';
import type { ApiResponse, Booking } from '@hometik/shared-types';

/**
 * GET /api/bookings
 * Fetch bookings for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const asBarber = searchParams.get('as_barber') === 'true';
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const clientForDb =
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-role-key'
        ? supabaseAdmin
        : supabase;

    let query = clientForDb
      .from('bookings')
      .select('*, user:profiles!bookings_user_id_fkey(*), barber:profiles!bookings_barber_id_fkey(*)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (asBarber) {
      query = query.eq('barber_id', user.id);
    } else {
      query = query.eq('user_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error } = await query;

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Booking[]>>({
      success: true,
      data: bookings as Booking[],
      error: null,
    });
  } catch (err) {
    console.error('[API] GET /api/bookings error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * Create a new booking and dispatch to nearby barbers
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createBookingSchema.safeParse(body);

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

    const { service_type, notes, total_price, user_location, scheduled_at, barber_id } =
      validation.data;

    const clientForDb =
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-role-key'
        ? supabaseAdmin
        : supabase;

    // Insert booking into database with PostGIS point
    const { data: booking, error: insertError } = await clientForDb
      .from('bookings')
      .insert({
        user_id: user.id,
        barber_id: barber_id ?? null,
        service_type,
        notes: notes ?? null,
        total_price,
        user_address: user_location.address,
        user_location: `POINT(${user_location.longitude} ${user_location.latitude})`,
        scheduled_at: scheduled_at ?? null,
        status: barber_id ? 'ACCEPTED' : 'PENDING',
      })
      .select()
      .single();

    if (insertError || !booking) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: insertError?.message ?? 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Map DB record to Booking type
    const mappedBooking: Booking = {
      ...booking,
      user_location: {
        latitude: user_location.latitude,
        longitude: user_location.longitude,
        address: user_location.address,
      },
    } as Booking;

    // Dispatch to nearby barbers (async, non-blocking)
    DispatchingService.dispatchBooking(mappedBooking).catch((err) =>
      console.error('[API] Dispatch error:', err)
    );

    return NextResponse.json<ApiResponse<Booking>>(
      { success: true, data: mappedBooking, error: null },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API] POST /api/bookings error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
