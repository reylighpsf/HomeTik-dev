import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const memoryStorage = new Map<string, string>();

let mmkvInstance: any = null;
if (Platform.OS !== 'web') {
  try {
    const { MMKV } = require('react-native-mmkv');
    mmkvInstance = new MMKV({ id: 'hometik-mitra-auth' });
  } catch {
    // Fallback ke memoryStorage pada Expo Go
  }
}

const crossPlatformStorageAdapter = {
  getItem: (key: string): string | null => {
    if (mmkvInstance) {
      try {
        return mmkvInstance.getString(key) ?? null;
      } catch {}
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
      } catch {}
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
      } catch {}
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

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: crossPlatformStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
