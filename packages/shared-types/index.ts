// ============================================================================
// @hometik/shared-types
// Shared TypeScript interfaces and types for the HomeTik monorepo.
// ============================================================================

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

/** Roles a user can have in the system. */
export type UserRole = 'USER' | 'BARBER' | 'ADMIN';

/** Lifecycle statuses for a booking. */
export type BookingStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_TRANSIT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

// ---------------------------------------------------------------------------
// Core Entities
// ---------------------------------------------------------------------------

/** A registered user / profile. */
export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  avatar_url: string | null;
  email?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Alias Profile for DB table 1:1 parity with profiles table */
export type Profile = User;

/** Extended details for users with the BARBER role. */
export interface BarberDetails {
  id: string;
  profile_id: string;
  is_online: boolean;
  rating: number;
  total_reviews: number;
  specialties: string[];
  current_location: { latitude: number; longitude: number } | null;
  created_at: string;
  updated_at: string;
}

/** A bookable service offered by barbers. */
export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  base_price: number;
  duration_minutes: number;
  category: string;
  is_active: boolean;
}

/** A booking between a user and a barber. */
export interface Booking {
  id: string;
  user_id: string;
  barber_id: string | null;
  status: BookingStatus;
  service_type: string;
  notes: string | null;
  total_price: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  user_location: { latitude: number; longitude: number; address: string };
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Derived / View Types
// ---------------------------------------------------------------------------

/** A barber with pre-computed distance, returned by the nearby-barbers query. */
export interface NearbyBarber extends BarberDetails {
  /** Distance from the querying user's location in kilometres. */
  distance_km: number;
  /** Barber's display name (from profiles). */
  user_name: string;
  /** Barber's avatar URL (from profiles). */
  user_avatar_url: string | null;
}

// ---------------------------------------------------------------------------
// API Payloads
// ---------------------------------------------------------------------------

/** Payload sent by a user to create a new booking. */
export interface CreateBookingPayload {
  service_type: string;
  notes?: string | null;
  total_price: number;
  user_location: { latitude: number; longitude: number; address: string };
  scheduled_at?: string | null;
}

// ---------------------------------------------------------------------------
// Generic API Wrapper
// ---------------------------------------------------------------------------

/** Standard envelope for all API responses. */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}
