import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireRoles } from '@/lib/auth/rbac';
import { z } from 'zod';
import type { ApiResponse } from '@hometik/shared-types';

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  is_online: z.boolean().optional(),
});

/**
 * POST /api/barbers/location
 * Updates the current barber's GPS location and online status (Role: BARBER, ADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoles(['BARBER', 'ADMIN']);
    if (!auth.authorized) {
      return auth.response;
    }
    const user = auth.context.user;
    const supabase = await createServerSupabaseClient();

    const body = await request.json();
    const validation = updateLocationSchema.safeParse(body);

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

    const { latitude, longitude, is_online } = validation.data;

    const clientForDb =
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-role-key'
        ? supabaseAdmin
        : supabase;

    const updatePayload: Record<string, any> = {
      profile_id: user.id,
      current_location: `POINT(${longitude} ${latitude})`,
      updated_at: new Date().toISOString(),
    };

    if (is_online !== undefined) {
      updatePayload.is_online = is_online;
    }

    const { data, error } = await clientForDb
      .from('barber_details')
      .upsert(updatePayload, { onConflict: 'profile_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        profile_id: user.id,
        latitude,
        longitude,
        is_online: data.is_online,
      },
      error: null,
    });
  } catch (err) {
    console.error('[API] POST /api/barbers/location error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
