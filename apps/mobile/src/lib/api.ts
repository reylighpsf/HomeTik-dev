import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Mendapatkan URL Backend API secara cerdas dan otomatis:
 * 1. Jika EXPO_PUBLIC_API_URL diset ke IP Wi-Fi (bukan localhost/127.0.0.1), gunakan itu.
 * 2. Di Web Browser: gunakan http://localhost:3000.
 * 3. Di HP Fisik (Expo Go): otomatis mendeteksi IP komputer server via Constants.expoConfig?.hostUri.
 * 4. Di Android Emulator: gunakan alias http://10.0.2.2:3000.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // Jika pengguna menyetel IP Wi-Fi secara eksplisit di .env (bukan localhost/127.0.0.1)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  // Di Web Browser PC
  if (Platform.OS === 'web') {
    return envUrl || 'http://localhost:3000';
  }

  // Di HP Fisik melalui Expo Go (otomatis deteksi IP laptop/PC server)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp) {
      return `http://${hostIp}:3000`;
    }
  }

  // Fallback untuk Android Studio Emulator
  return 'http://10.0.2.2:3000';
};
