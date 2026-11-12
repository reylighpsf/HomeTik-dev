import React, { useState, useEffect } from 'react';
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
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { THEME } from '@/constants/theme';
import { ASSETS } from '@/constants/assets';

export default function ProfileScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('fathur@hometik.com');
  const [userName, setUserName] = useState('Fathur Rahman');
  const [userRole, setUserRole] = useState('Customer VIP');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        if (user.email) setUserEmail(user.email);
        if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        } else if (user.email) {
          setUserName(user.email.split('@')[0]);
        }
        if (user.user_metadata?.role === 'barber') {
          setUserRole('Mitra Barber');
        }
      }
    });
  }, []);

  const handleLogout = () => {
    const confirmLogout = async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
      if (Platform.OS === 'web') {
        window.alert('Anda telah keluar dari aplikasi Hometik.');
      } else {
        Alert.alert('Berhasil Keluar', 'Anda telah keluar dari akun Hometik.');
      }
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Apakah Anda yakin ingin keluar dari akun?')) {
        confirmLogout();
      }
    } else {
      Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun Hometik?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: confirmLogout },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: ASSETS.userAvatar }} style={styles.avatar} />
            <View style={styles.verifiedDot}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>

          {/* Membership Tier Badge with Black/Obsidian Combination */}
          <View style={styles.vipBadge}>
            <Ionicons name="diamond" size={13} color="#F59E0B" />
            <Text style={styles.vipBadgeText}>{userRole.toUpperCase()}</Text>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Total Order</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>1.420</Text>
            <Text style={styles.statLabel}>Poin Reward</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>Rp 245k</Text>
            <Text style={styles.statLabel}>Saldo Pay</Text>
          </View>
        </View>

        {/* Account Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>AKUN & KEAMANAN</Text>
          <View style={styles.menuGroup}>
            {[
              {
                icon: 'person-outline' as const,
                title: 'Informasi Pribadi',
                subtitle: 'Nama, email, dan no telepon terdaftar',
              },
              {
                icon: 'location-outline' as const,
                title: 'Alamat Tersimpan',
                subtitle: 'Alamat rumah, kantor, dan favorit',
              },
              {
                icon: 'wallet-outline' as const,
                title: 'Metode Pembayaran',
                subtitle: 'HometikPay, QRIS, Transfer Bank, dan Kartu',
              },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.menuItem,
                  idx !== 2 && styles.menuItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => Alert.alert(item.title, item.subtitle)}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={18} color="#00B14F" />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PENGATURAN & BANTUAN</Text>
          <View style={styles.menuGroup}>
            {[
              {
                icon: 'notifications-outline' as const,
                title: 'Notifikasi & Pengingat',
                subtitle: 'Promo diskon dan status kedatangan mitra',
              },
              {
                icon: 'shield-checkmark-outline' as const,
                title: 'SafeShield Protocol & Syarat',
                subtitle: 'Kebijakan privasi & standar higienis steril',
              },
              {
                icon: 'headset-outline' as const,
                title: 'Pusat Bantuan 24/7',
                subtitle: 'Hubungi CS Hometik via WhatsApp & Telepon',
              },
            ].map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.menuItem,
                  idx !== 2 && styles.menuItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => Alert.alert(item.title, item.subtitle)}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={18} color="#00B14F" />
                </View>
                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
          accessibilityLabel="Tombol Keluar Akun"
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>

        {/* App Version Info */}
        <Text style={styles.versionText}>Hometik App v1.0.0 • On-Demand Grooming</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: 110,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xxl,
    padding: THEME.spacing.xl,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'relative',
    marginBottom: THEME.spacing.md,
    borderWidth: 2.5,
    borderColor: '#00B14F',
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00B14F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: THEME.spacing.md,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    paddingVertical: 14,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: THEME.spacing.sm,
    marginLeft: THEME.spacing.xs,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.xl,
    gap: 8,
    marginBottom: THEME.spacing.md,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: THEME.spacing.lg,
  },
});
