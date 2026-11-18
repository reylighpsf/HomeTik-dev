import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Profile } from '@hometik/shared-types';

const PROFILE_QUERY_KEY = ['user-profile'] as const;

export interface SavedAddressItem {
  id: string;
  label: string;
  address: string;
  landmark: string;
  isPrimary: boolean;
}

export const DEFAULT_SAVED_ADDRESSES: SavedAddressItem[] = [
  {
    id: 'addr-1',
    label: 'Rumah (Utama)',
    address: 'Jl. Pemuda No. 45, Genteng, Surabaya',
    landmark: 'Rumah cat putih pagar hitam, bel di samping pintu gerbang.',
    isPrimary: true,
  },
  {
    id: 'addr-2',
    label: 'Kantor',
    address: 'Jl. Basuki Rahmat No. 12, Embong Kaliasin, Surabaya',
    landmark: 'Gedung Wisma Niaga Lt. 3, drop off lobby utama.',
    isPrimary: false,
  },
];

export interface UserProfileData extends Profile {
  saved_addresses: SavedAddressItem[];
  wallet_balance: number;
  reward_points: number;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatar_url?: string;
  saved_addresses?: SavedAddressItem[];
  wallet_balance?: number;
  reward_points?: number;
}

const DEFAULT_AVATAR_ONLINE =
  'https://ossralrurmrtnxyctdqs.supabase.co/storage/v1/object/public/avatars/default-avatar.png';

export function useProfile() {
  const { user, isAuthenticated, refreshSession } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: [...PROFILE_QUERY_KEY, user?.id],
    queryFn: async (): Promise<UserProfileData | null> => {
      if (!user) return null;

      try {
        const { data: dbProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('[useProfile] Error fetching profiles table:', error.message);
        }

        const meta = user.user_metadata || {};
        const savedAddresses: SavedAddressItem[] =
          Array.isArray(meta.saved_addresses) && meta.saved_addresses.length > 0
            ? meta.saved_addresses
            : DEFAULT_SAVED_ADDRESSES;

        const walletBalance: number =
          typeof meta.wallet_balance === 'number' ? meta.wallet_balance : 245000;

        const rewardPoints: number =
          typeof meta.reward_points === 'number' ? meta.reward_points : 1420;

        const name =
          dbProfile?.name ||
          meta.full_name ||
          meta.name ||
          user.email?.split('@')[0] ||
          'Pengguna Hometik';

        const phone = dbProfile?.phone || meta.phone || '';
        const avatarUrl = dbProfile?.avatar_url || meta.avatar_url || DEFAULT_AVATAR_ONLINE;
        const role = dbProfile?.role || (meta.role as any) || 'USER';

        return {
          id: user.id,
          role,
          name,
          email: user.email || '',
          phone,
          avatar_url: avatarUrl,
          created_at: dbProfile?.created_at || user.created_at,
          updated_at: dbProfile?.updated_at || new Date().toISOString(),
          saved_addresses: savedAddresses,
          wallet_balance: walletBalance,
          reward_points: rewardPoints,
        };
      } catch (err) {
        console.warn('[useProfile] Unexpected error in profileQuery:', err);
        return null;
      }
    },
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 1000 * 60 * 3, // 3 menit
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      if (!user) throw new Error('Pengguna tidak terautentikasi');

      const now = new Date().toISOString();

      // 1. Simpan perubahan atribut tabel profiles (name, phone, avatar_url)
      const dbUpdates: Record<string, any> = { updated_at: now };
      if (payload.name !== undefined) dbUpdates.name = payload.name;
      if (payload.phone !== undefined) dbUpdates.phone = payload.phone;
      if (payload.avatar_url !== undefined) dbUpdates.avatar_url = payload.avatar_url;

      if (Object.keys(dbUpdates).length > 1) {
        const { error: dbError } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', user.id);

        if (dbError) {
          // Jika row belum ada, upsert
          const { error: upsertErr } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              role: (user.user_metadata?.role as any) || 'USER',
              ...dbUpdates,
            });

          if (upsertErr) {
            console.warn('[useProfile] Upsert error in profiles table:', upsertErr.message);
          }
        }
      }

      // 2. Simpan seluruh perubahan (termasuk saved_addresses, wallet_balance, reward_points) ke auth.users raw_user_meta_data
      const metaUpdates: Record<string, any> = {
        ...(user.user_metadata || {}),
      };

      if (payload.name !== undefined) {
        metaUpdates.full_name = payload.name;
        metaUpdates.name = payload.name;
      }
      if (payload.phone !== undefined) metaUpdates.phone = payload.phone;
      if (payload.avatar_url !== undefined) metaUpdates.avatar_url = payload.avatar_url;
      if (payload.saved_addresses !== undefined) metaUpdates.saved_addresses = payload.saved_addresses;
      if (payload.wallet_balance !== undefined) metaUpdates.wallet_balance = payload.wallet_balance;
      if (payload.reward_points !== undefined) metaUpdates.reward_points = payload.reward_points;

      const { data: authUser, error: authError } = await supabase.auth.updateUser({
        data: metaUpdates,
      });

      if (authError) {
        console.warn('[useProfile] Error updating user metadata:', authError.message);
      }

      // 3. Refresh session untuk sinkronisasi state
      if (refreshSession) {
        await refreshSession();
      }

      return authUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    refetch: profileQuery.refetch,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
}
