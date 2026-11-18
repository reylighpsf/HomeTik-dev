import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string().min(8, 'Nomor HP minimal 8 karakter').optional().or(z.literal('')),
  role: z.enum(['USER', 'BARBER', 'ADMIN']).default('USER'),
  specialties: z.array(z.string()).optional(),
  turnstileToken: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const sendOtpSchema = z.object({
  phone: z.string().min(8, 'Nomor HP minimal 8 karakter').optional().or(z.literal('')),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter').optional(),
  channel: z.enum(['email', 'sms', 'whatsapp']).default('email'),
  purpose: z.enum(['signup', 'forgot_password', 'login']).optional(),
  isResend: z.boolean().optional(),
  name: z.string().optional(),
  role: z.enum(['USER', 'BARBER', 'ADMIN']).default('USER'),
}).refine((data) => Boolean(data.phone) || Boolean(data.email), {
  message: 'Nomor telepon atau email wajib diisi untuk pengiriman OTP',
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  token: z.string().min(4, 'Kode OTP minimal 4-6 digit'),
  type: z.enum(['email', 'sms', 'signup', 'recovery', 'magiclink', 'phone_change']).default('email'),
}).refine((data) => Boolean(data.phone) || Boolean(data.email), {
  message: 'Nomor telepon atau email wajib disertakan untuk verifikasi OTP',
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

