import { NextRequest, NextResponse } from 'next/server';
import { DispatchingService } from '@/services/dispatching.service';
import type { ApiResponse, NearbyBarber } from '@hometik/shared-types';

/**
 * GET /api/barbers/nearby?lat=-6.2088&lng=106.8456&radius=5
 * Finds nearby online barbers based on PostGIS coordinates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius') ?? '5';

    if (!latStr || !lngStr) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: 'Parameter lat dan lng diperlukan',
        },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    const radiusKm = parseFloat(radiusStr);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          error: 'Koordinat lat/lng tidak valid',
        },
        { status: 400 }
      );
    }

    const barbers = await DispatchingService.findNearbyBarbers(
      latitude,
      longitude,
      radiusKm
    );

    return NextResponse.json<ApiResponse<NearbyBarber[]>>({
      success: true,
      data: barbers,
      error: null,
    });
  } catch (err) {
    console.error('[API] GET /api/barbers/nearby error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
