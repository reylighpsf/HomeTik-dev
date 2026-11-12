import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { ApiResponse, Service } from '@hometik/shared-types';

const FALLBACK_SERVICES: Service[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Classic Haircut',
    description: 'Potong rambut rapi berkelas, termasuk cuci rambut dan styling ringan.',
    icon: 'scissors',
    base_price: 50000,
    duration_minutes: 45,
    category: 'Haircut',
    is_active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Beard Grooming & Shave',
    description: 'Perapian jenggot/kumis dengan handuk hangat dan aftershave soothing.',
    icon: 'smile',
    base_price: 35000,
    duration_minutes: 30,
    category: 'Shaving',
    is_active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Full VIP Grooming Package',
    description: 'Paket lengkap: Haircut, Beard Trim, Head & Shoulder Massage, dan Hair Tonic.',
    icon: 'sparkles',
    base_price: 85000,
    duration_minutes: 60,
    category: 'Package',
    is_active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Kids Haircut',
    description: 'Potong rambut khusus anak-anak dengan pendekatan sabar dan menyenangkan.',
    icon: 'user',
    base_price: 40000,
    duration_minutes: 30,
    category: 'Haircut',
    is_active: true,
  },
];

/**
 * GET /api/services
 * Returns active grooming services
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('base_price', { ascending: true });

    if (error || !services || services.length === 0) {
      // Fallback jika database belum di-seed
      return NextResponse.json<ApiResponse<Service[]>>({
        success: true,
        data: FALLBACK_SERVICES,
        error: null,
      });
    }

    return NextResponse.json<ApiResponse<Service[]>>({
      success: true,
      data: services as Service[],
      error: null,
    });
  } catch (err) {
    console.error('[API] GET /api/services error:', err);
    return NextResponse.json<ApiResponse<Service[]>>({
      success: true,
      data: FALLBACK_SERVICES,
      error: null,
    });
  }
}
