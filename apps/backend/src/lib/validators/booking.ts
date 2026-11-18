import { z } from 'zod';

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1, 'Address is required'),
});

export const createBookingSchema = z.object({
  service_type: z.string().min(1, 'Service type is required'),
  notes: z.string().nullable().optional(),
  total_price: z.number().positive('Price must be positive'),
  user_location: locationSchema,
  scheduled_at: z.string().datetime().nullable().optional(),
  barber_id: z.string().uuid().nullable().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingSchema = z.object({
  status: z
    .enum([
      'DRAFT',
      'PENDING',
      'ACCEPTED',
      'IN_TRANSIT',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ])
    .optional(),
  barber_id: z.string().uuid().optional(),
  notes: z.string().nullable().optional(),
});

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

