import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// In-memory fallback for Expo Go and unsupported environments
const memoryStorage = new Map<string, string>();

// Robust cross-platform storage adapter (MMKV for production native build, localStorage for Web, in-memory for Expo Go)
let mmkvInstance: any = null;
if (Platform.OS !== 'web') {
  try {
    const { MMKV } = require('react-native-mmkv');
    mmkvInstance = new MMKV({ id: 'hometik-auth' });
  } catch (e) {
    // MMKV native module is not linked in Expo Go; memoryStorage fallback will be used
  }
}

const crossPlatformStorageAdapter = {
  getItem: (key: string): string | null => {
    if (mmkvInstance) {
      try {
        return mmkvInstance.getString(key) ?? null;
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStorage.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    if (mmkvInstance) {
      try {
        mmkvInstance.set(key, value);
        return;
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    memoryStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    if (mmkvInstance) {
      try {
        mmkvInstance.delete(key);
        return;
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
    memoryStorage.delete(key);
  },
};

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] Warning: Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Falling back to placeholder client.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: crossPlatformStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
