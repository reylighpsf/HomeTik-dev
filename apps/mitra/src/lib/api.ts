import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Mendapatkan URL Backend API Next.js secara otomatis:
 * 1. Jika EXPO_PUBLIC_API_URL diset (bukan localhost/127.0.0.1), gunakan itu.
 * 2. Di Web Browser: http://localhost:3000.
 * 3. Di HP Fisik (Expo Go): deteksi IP laptop dari Constants.expoConfig?.hostUri.
 * 4. Di Android Studio Emulator: http://10.0.2.2:3000.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'web') {
    return envUrl || 'http://localhost:3000';
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp) {
      return `http://${hostIp}:3000`;
    }
  }

  return 'http://10.0.2.2:3000';
};
