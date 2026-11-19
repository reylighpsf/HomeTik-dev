import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMitraAuth } from '@/context/MitraAuthContext';
import { MITRA_THEME } from '@/constants/theme';

const DEFAULT_AVATAR = require('../../../../assets/default-avatar.png');

export default function MitraProfileScreen() {
  const router = useRouter();
  const { profile, barberDetails, signOut } = useMitraAuth();

  const avatarSource =
    profile?.avatar_url && !profile.avatar_url.includes('placeholder')
      ? { uri: profile.avatar_url }
      : DEFAULT_AVATAR;

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Keluar dari akun HomeTik Mitra? Status Anda akan diubah menjadi Offline.')) {
        signOut().then(() => router.replace('/login'));
      }
      return;
    }

    Alert.alert(
      'Keluar Akun Mitra',
      'Status siaga Anda akan otomatis diubah ke Offline. Lanjutkan keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={styles.headerDot} />
          <Text style={styles.headerTitle}>Profil Mitra</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Identity Card */}
        <View style={styles.profileCard}>
          <Image source={avatarSource} style={styles.avatar} />
          <Text style={styles.name}>{profile?.name || 'Mitra HomeTik'}</Text>
          <Text style={styles.email}>{profile?.email || '-'}</Text>

          <View style={styles.verifiedPill}>
            <Ionicons name="shield-checkmark" size={14} color={MITRA_THEME.colors.primary} />
            <Text style={styles.verifiedText}>
              Mitra Barber • ★ {Number(barberDetails?.rating ?? 4.9).toFixed(1)} (
              {barberDetails?.total_reviews ?? 0} ulasan)
            </Text>
          </View>
        </View>

        {/* Specialties */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Keahlian Layanan</Text>
          <View style={styles.chipsWrap}>
            {(barberDetails?.specialties?.length
              ? barberDetails.specialties
              : ['Gentleman Cut', 'Hair Tattoo / Fade', 'Creambath', 'Shaving']
            ).map((sp) => (
              <View key={sp} style={styles.chip}>
                <Text style={styles.chipText}>{sp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Akun</Text>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={MITRA_THEME.colors.primary} />
            <Text style={styles.infoText}>{profile?.phone || 'Belum ada nomor WA'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={18} color={MITRA_THEME.colors.primary} />
            <Text style={styles.infoText}>Role: {profile?.role || 'BARBER'}</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={18} color={MITRA_THEME.colors.error} />
          <Text style={styles.logoutBtnText}>Keluar dari Akun Mitra</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MITRA_THEME.colors.background,
  },
  topHeader: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: MITRA_THEME.colors.border,
    ...MITRA_THEME.shadows.card,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: MITRA_THEME.colors.primary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...MITRA_THEME.shadows.card,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: MITRA_THEME.colors.textPrimary,
  },
  email: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: MITRA_THEME.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: MITRA_THEME.colors.primary,
  },
  card: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    ...MITRA_THEME.shadows.card,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: MITRA_THEME.colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MITRA_THEME.colors.borderSubtle,
  },
  infoText: {
    fontSize: 13,
    color: MITRA_THEME.colors.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: MITRA_THEME.colors.errorContainer,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: MITRA_THEME.colors.error,
  },
});
