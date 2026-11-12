/**
 * Mendapatkan URL Backend API secara manual dari file environment:
 * Konfigurasi diatur langsung di: apps/mobile/.env.local (EXPO_PUBLIC_API_URL)
 *
 * Contoh pengaturan manual di .env.local:
 * - Android Emulator: EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
 * - HP Fisik (Wi-Fi): EXPO_PUBLIC_API_URL=http://192.168.1.59:3000
 * - Web Browser / Simulator: EXPO_PUBLIC_API_URL=http://localhost:3000
 */
export const getApiBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
};
