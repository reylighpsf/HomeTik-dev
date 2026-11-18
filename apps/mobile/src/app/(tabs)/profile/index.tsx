import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/use-profile';
import { supabase } from '@/lib/supabase';
import { THEME } from '@/constants/theme';
import { ASSETS, getAvatarSource } from '@/constants/assets';

interface SavedAddressItem {
  id: string;
  label: string;
  address: string;
  landmark: string;
  isPrimary: boolean;
}

const DEFAULT_ADDRESSES: SavedAddressItem[] = [
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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isGuest, signOut } = useAuth();
  const { profile, isLoading: isLoadingProfile, updateProfile, isUpdating } = useProfile();

  // Dynamic user details
  const displayName = profile?.name || user?.user_metadata?.full_name || 'Fathur Rahman';
  const displayEmail = profile?.email || user?.email || 'fathur@hometik.com';
  const displayPhone = profile?.phone || user?.user_metadata?.phone || '0812-3456-7890';
  const avatarSource = getAvatarSource(profile?.avatar_url);
  const userRole = (profile?.role === 'BARBER' ? 'Mitra Barber' : 'Customer VIP');

  // Wallet & points state
  const [walletBalance, setWalletBalance] = useState(245000);
  const [rewardPoints, setRewardPoints] = useState(1420);

  // Saved addresses state
  const [addresses, setAddresses] = useState<SavedAddressItem[]>(DEFAULT_ADDRESSES);

  // Sync state from profile query whenever profile loads from Supabase DB
  React.useEffect(() => {
    if (profile) {
      if (profile.saved_addresses && profile.saved_addresses.length > 0) {
        setAddresses(profile.saved_addresses);
      }
      if (typeof profile.wallet_balance === 'number') {
        setWalletBalance(profile.wallet_balance);
      }
      if (typeof profile.reward_points === 'number') {
        setRewardPoints(profile.reward_points);
      }
      if (profile.name) setEditName(profile.name);
      if (profile.phone) setEditPhone(profile.phone);
    }
  }, [profile]);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMitraInfoOpen, setIsMitraInfoOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Edit profile form state
  const [editName, setEditName] = useState(displayName);
  const [editPhone, setEditPhone] = useState(displayPhone);

  // New address form state
  const [newLabel, setNewLabel] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Top up state
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState<number>(100000);
  const [selectedTopUpMethod, setSelectedTopUpMethod] = useState<'qris' | 'bca' | 'mandiri' | 'retail'>('qris');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  // Handle Edit Profile Save to Supabase DB
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Data Tidak Lengkap', 'Nama lengkap tidak boleh kosong.');
      return;
    }

    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      setIsEditProfileOpen(false);
      Alert.alert('Tersimpan di Database!', 'Data profil Anda telah berhasil disimpan.');
    } catch (err: any) {
      Alert.alert('Gagal Menyimpan', err?.message || 'Terjadi kesalahan saat menyimpan profil.');
    }
  };

  // Handle Ganti Kata Sandi (Simpan ke Supabase Auth)
  const handleChangePassword = async () => {
    if (!newPassword) {
      Alert.alert('Data Tidak Lengkap', 'Silakan masukkan kata sandi baru.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Kata Sandi Lemah', 'Kata sandi minimal harus 6 karakter.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Kata Sandi Tidak Cocok', 'Konfirmasi kata sandi baru tidak sesuai.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Alert.alert('Gagal Mengubah Kata Sandi', error.message || 'Terjadi kesalahan.');
        setIsChangingPassword(false);
        return;
      }

      setIsChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      Alert.alert(
        'Kata Sandi Berhasil Diperbarui!',
        'Kata sandi akun Anda telah diperbarui dengan sukses.'
      );
    } catch (err: any) {
      Alert.alert('Error', 'Gagal mengubah kata sandi. Silakan coba lagi nanti.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Set Primary Address (Simpan ke DB)
  const handleSetPrimaryAddress = (id: string) => {
    const updated = addresses.map((item) => ({
      ...item,
      isPrimary: item.id === id,
    }));
    setAddresses(updated);
    updateProfile({ saved_addresses: updated }).catch((err) =>
      console.warn('[Profile] Error saving primary address to DB:', err)
    );
  };

  // Handle Add New Address (Simpan ke DB)
  const handleSaveNewAddress = () => {
    if (!newLabel.trim() || !newAddressText.trim()) {
      Alert.alert('Data Belum Lengkap', 'Mohon isi label (misal: Rumah/Apartemen) dan alamat lengkap.');
      return;
    }

    const newAddr: SavedAddressItem = {
      id: `addr-${Date.now()}`,
      label: newLabel.trim(),
      address: newAddressText.trim(),
      landmark: newLandmark.trim() || 'Tanpa patokan khusus',
      isPrimary: addresses.length === 0,
    };

    const updated = [...addresses, newAddr];
    setAddresses(updated);
    setNewLabel('');
    setNewAddressText('');
    setNewLandmark('');
    setIsAddingAddress(false);
    updateProfile({ saved_addresses: updated }).catch((err) =>
      console.warn('[Profile] Error saving new address to DB:', err)
    );
    Alert.alert('Alamat Tersimpan', `Alamat "${newAddr.label}" berhasil disimpan.`);
  };

  // Handle Delete Address (Simpan ke DB)
  const handleDeleteAddress = (id: string) => {
    if (addresses.length <= 1) {
      Alert.alert('Tidak Dapat Dihapus', 'Anda harus memiliki minimal 1 alamat tersimpan.');
      return;
    }
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    updateProfile({ saved_addresses: updated }).catch((err) =>
      console.warn('[Profile] Error updating deleted address in DB:', err)
    );
  };

  // Handle Top-Up Execution (Simpan saldo baru ke DB)
  const handleConfirmTopUp = () => {
    setIsProcessingTopUp(true);
    setTimeout(async () => {
      const newBalance = walletBalance + selectedTopUpAmount;
      const newPoints = rewardPoints + Math.floor(selectedTopUpAmount / 1000);
      setWalletBalance(newBalance);
      setRewardPoints(newPoints);
      setIsProcessingTopUp(false);
      setIsWalletOpen(false);

      try {
        await updateProfile({
          wallet_balance: newBalance,
          reward_points: newPoints,
        });
      } catch (err) {
        console.warn('[Profile] Error saving wallet balance to DB:', err);
      }

      const msg = `Top-up HometikPay sebesar Rp ${selectedTopUpAmount.toLocaleString(
        'id-ID'
      )} via ${selectedTopUpMethod.toUpperCase()} berhasil! Saldo baru Rp ${newBalance.toLocaleString(
        'id-ID'
      )} telah tersimpan di database akun Anda.`;

      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Top-Up Berhasil! 💳', msg);
      }
    }, 1200);
  };

  // Handle Open WhatsApp Support
  const handleOpenWhatsAppSupport = () => {
    const phoneNo = '6281234567890';
    const message = encodeURIComponent(
      'Halo CS Hometik, saya memerlukan bantuan terkait layanan cukur rambut / akun saya.'
    );
    const waUrl = `https://wa.me/${phoneNo}?text=${message}`;

    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported || Platform.OS === 'web') {
          return Linking.openURL(waUrl);
        } else {
          Alert.alert(
            'WhatsApp Tidak Ditemukan',
            `Silakan hubungi WhatsApp Customer Service resmi Hometik di +${phoneNo}.`
          );
        }
      })
      .catch(() => {
        Alert.alert('Kontak CS Hometik', `Silakan hubungi kami via WhatsApp: +${phoneNo}`);
      });
  };

  // Handle Logout
  const handleLogout = () => {
    const confirmLogout = async () => {
      await signOut();
      if (Platform.OS === 'web') {
        window.alert('Anda telah keluar dari aplikasi Hometik.');
      } else {
        Alert.alert('Berhasil Keluar', 'Anda telah keluar dari akun Hometik.');
      }
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Apakah Anda yakin ingin keluar dari akun Hometik?')) {
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
        {/* Guest Banner if not authenticated */}
        {(!isAuthenticated || isGuest) && (
          <View style={styles.guestBanner}>
            <View style={styles.guestBannerLeft}>
              <Ionicons name="person-circle-outline" size={28} color="#00B14F" />
              <View style={styles.guestBannerTextCol}>
                <Text style={styles.guestBannerTitle}>Anda Dalam Mode Tamu</Text>
                <Text style={styles.guestBannerSubtitle}>
                  Masuk untuk mengelola data akun, alamat, dan saldo dompet.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.guestLoginBtn}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.guestLoginBtnText}>Masuk</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image source={avatarSource} style={styles.avatar} />
            <TouchableOpacity
              style={styles.editAvatarBadge}
              onPress={() => {
                setEditName(displayName);
                setEditPhone(displayPhone);
                setIsEditProfileOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>

          {/* Membership Tier Badge */}
          <View style={styles.vipBadge}>
            <Ionicons name="diamond" size={13} color="#F59E0B" />
            <Text style={styles.vipBadgeText}>{userRole.toUpperCase()}</Text>
          </View>

          {/* Quick Edit Profile Button */}
          <TouchableOpacity
            style={styles.quickEditBtn}
            onPress={() => {
              setEditName(displayName);
              setEditPhone(displayPhone);
              setIsEditProfileOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={14} color="#00B14F" />
            <Text style={styles.quickEditBtnText}>Ubah Data Profil</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Row: Orders, Points, Wallet */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Total Order</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statBox}
            onPress={() =>
              Alert.alert(
                'Hometik Reward Points 🎁',
                `Anda memiliki ${rewardPoints.toLocaleString(
                  'id-ID'
                )} poin reward. Kumpulkan 2.000 poin untuk mendapatkan 1x potong rambut gratis!`
              )
            }
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{rewardPoints.toLocaleString('id-ID')}</Text>
            <Text style={styles.statLabel}>Poin Reward</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => setIsWalletOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>Rp {(walletBalance / 1000).toFixed(0)}k</Text>
            <Text style={styles.statLabel}>Saldo Pay ⚡</Text>
          </TouchableOpacity>
        </View>

        {/* Recruitment Mitra Banner */}
        <TouchableOpacity
          style={styles.mitraBanner}
          onPress={() => setIsMitraInfoOpen(true)}
          activeOpacity={0.88}
        >
          <View style={styles.mitraBannerLeft}>
            <View style={styles.mitraIconCircle}>
              <Ionicons name="cut" size={20} color="#00B14F" />
            </View>
            <View style={styles.mitraTextCol}>
              <Text style={styles.mitraBannerTitle}>Ingin Jadi Mitra Barber?</Text>
              <Text style={styles.mitraBannerSubtitle}>
                Dapatkan penghasilan jutaan/minggu dengan jam kerja fleksibel.
              </Text>
            </View>
          </View>
          <Ionicons name="arrow-forward-circle" size={24} color="#00B14F" />
        </TouchableOpacity>

        {/* Account Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>AKUN & KEAMANAN</Text>
          <View style={styles.menuGroup}>
            {/* 1. Informasi Pribadi */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              activeOpacity={0.7}
              onPress={() => {
                setEditName(displayName);
                setEditPhone(displayPhone);
                setIsEditProfileOpen(true);
              }}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="person-outline" size={18} color="#00B14F" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Informasi Pribadi</Text>
                <Text style={styles.menuSubtitle}>{displayPhone || 'Nama, email & nomor HP'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* 2. Alamat Tersimpan */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              activeOpacity={0.7}
              onPress={() => setIsAddressesOpen(true)}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="location-outline" size={18} color="#00B14F" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Alamat Tersimpan</Text>
                <Text style={styles.menuSubtitle}>
                  {addresses.find((a) => a.isPrimary)?.label || `${addresses.length} alamat tersimpan`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* 3. Metode Pembayaran & HometikPay */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              activeOpacity={0.7}
              onPress={() => setIsWalletOpen(true)}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="wallet-outline" size={18} color="#00B14F" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>HometikPay & Pembayaran</Text>
                <Text style={styles.menuSubtitle}>
                  Saldo: Rp {walletBalance.toLocaleString('id-ID')} • Top-Up Instan
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* 4. Ganti Kata Sandi */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setIsChangePasswordOpen(true);
              }}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#00B14F" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Ganti Kata Sandi</Text>
                <Text style={styles.menuSubtitle}>Perbarui kata sandi akun untuk keamanan</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences & Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PENGATURAN & BANTUAN</Text>
          <View style={styles.menuGroup}>
            {/* 1. Notifikasi */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Notifikasi & Promo',
                  'Pengingat jadwal pesanan dan diskon promo mingguan aktif via push notifikasi.'
                )
              }
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="notifications-outline" size={18} color="#00B14F" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Notifikasi & Pengingat</Text>
                <Text style={styles.menuSubtitle}>Update promo & status kedatangan barber</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* 2. Syarat & Ketentuan */}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemBorder]}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Syarat & Ketentuan Layanan',
                  '1. Tarif layanan mencakup ongkos perjalanan barber.\n2. Pembatalan setelah barber berangkat dikenakan biaya pengganti transport.\n3. Kebersihan dan higienitas alat dijamin oleh mitra barber.'
                )
              }
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#00B14F" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Syarat & Ketentuan Layanan</Text>
                <Text style={styles.menuSubtitle}>Kebijakan privasi & standar kenyamanan</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* 3. Pusat Bantuan & WhatsApp CS */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => setIsHelpOpen(true)}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name="headset-outline" size={18} color="#00B14F" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>Pusat Bantuan 24/7</Text>
                <Text style={styles.menuSubtitle}>WhatsApp CS resmi & FAQ kendala pesanan</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
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
        <Text style={styles.versionText}>Hometik App v1.0.0 • On-Demand Grooming Service</Text>
      </ScrollView>

      {/* ========================================================================= */}
      {/* 1. MODAL EDIT PROFIL                                                     */}
      {/* ========================================================================= */}
      <Modal
        visible={isEditProfileOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditProfileOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ubah Data Profil</Text>
              <TouchableOpacity onPress={() => setIsEditProfileOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalContent}>
              <View style={styles.editAvatarPreview}>
                <Image source={avatarSource} style={styles.modalAvatar} />
                <Text style={styles.avatarHint}>Foto profil terhubung dengan akun Supabase Anda</Text>
              </View>

              {/* Input Nama Lengkap */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Lengkap</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Masukkan nama lengkap Anda"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Input Nomor Telepon / WhatsApp */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nomor WhatsApp / Telepon</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Contoh: 081234567890"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Input Email (Read Only) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Terdaftar (Tidak Dapat Diubah)</Text>
                <TextInput
                  style={[styles.textInput, styles.textInputDisabled]}
                  value={displayEmail}
                  editable={false}
                />
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={isUpdating}
                activeOpacity={0.85}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. MODAL ALAMAT TERSIMPAN                                                */}
      {/* ========================================================================= */}
      <Modal
        visible={isAddressesOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddressesOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alamat Tersimpan</Text>
              <TouchableOpacity onPress={() => setIsAddressesOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalContent}>
              {/* List Alamat */}
              {addresses.map((item) => (
                <View
                  key={item.id}
                  style={[styles.addressItemCard, item.isPrimary && styles.addressItemCardActive]}
                >
                  <View style={styles.addressCardTop}>
                    <View style={styles.addressLabelWrap}>
                      <Ionicons
                        name={item.label.toLowerCase().includes('kantor') ? 'business' : 'home'}
                        size={16}
                        color={item.isPrimary ? '#00B14F' : '#64748B'}
                      />
                      <Text style={styles.addressLabelText}>{item.label}</Text>
                      {item.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>UTAMA</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteAddress(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.addressFullText}>{item.address}</Text>
                  <Text style={styles.addressLandmarkText}>📍 Patokan: {item.landmark}</Text>

                  {!item.isPrimary && (
                    <TouchableOpacity
                      style={styles.setPrimaryBtn}
                      onPress={() => handleSetPrimaryAddress(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.setPrimaryBtnText}>Jadikan Alamat Utama</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Form Tambah Alamat Baru */}
              {isAddingAddress ? (
                <View style={styles.newAddressBox}>
                  <Text style={styles.newAddressBoxTitle}>Tambah Alamat Baru</Text>

                  <TextInput
                    style={styles.textInput}
                    value={newLabel}
                    onChangeText={setNewLabel}
                    placeholder="Label Alamat (cth: Rumah, Kantor, Kos)"
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    style={[styles.textInput, { marginTop: 10 }]}
                    value={newAddressText}
                    onChangeText={setNewAddressText}
                    placeholder="Alamat Lengkap & Nomor Rumah"
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    style={[styles.textInput, { marginTop: 10 }]}
                    value={newLandmark}
                    onChangeText={setNewLandmark}
                    placeholder="Patokan (cth: Pagar hitam depan pos satpam)"
                    placeholderTextColor="#94A3B8"
                  />

                  <View style={styles.addAddressBtnRow}>
                    <TouchableOpacity
                      style={styles.cancelAddressBtn}
                      onPress={() => setIsAddingAddress(false)}
                    >
                      <Text style={styles.cancelAddressBtnText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveAddressBtn}
                      onPress={handleSaveNewAddress}
                    >
                      <Text style={styles.saveAddressBtnText}>Simpan Alamat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addAddressTrigger}
                  onPress={() => setIsAddingAddress(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={20} color="#00B14F" />
                  <Text style={styles.addAddressTriggerText}>Tambah Alamat Baru</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. MODAL HOMETIKPAY & TOP UP SALDO                                      */}
      {/* ========================================================================= */}
      <Modal
        visible={isWalletOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsWalletOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>HometikPay & Dompet</Text>
              <TouchableOpacity onPress={() => setIsWalletOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalContent}>
              {/* Virtual Card */}
              <View style={styles.walletCard}>
                <View style={styles.walletCardHeader}>
                  <Text style={styles.walletCardBrand}>HometikPay</Text>
                  <Ionicons name="wifi" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.walletBalanceLabel}>Saldo Tersedia</Text>
                <Text style={styles.walletBalanceAmount}>
                  Rp {walletBalance.toLocaleString('id-ID')}
                </Text>
                <View style={styles.walletCardFooter}>
                  <Text style={styles.walletCardUser}>{displayName.toUpperCase()}</Text>
                  <Text style={styles.walletCardStatus}>AKTIF • INSTAN</Text>
                </View>
              </View>

              {/* Pilihan Nominal Top Up */}
              <Text style={styles.sectionSubtitleText}>PILIH NOMINAL TOP-UP</Text>
              <View style={styles.topUpGrid}>
                {[50000, 100000, 200000, 500000].map((amt) => {
                  const isSelected = selectedTopUpAmount === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.topUpChip, isSelected && styles.topUpChipActive]}
                      onPress={() => setSelectedTopUpAmount(amt)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.topUpChipText, isSelected && styles.topUpChipTextActive]}>
                        Rp {(amt / 1000).toFixed(0)}k
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Pilihan Metode Bayar Top Up */}
              <Text style={[styles.sectionSubtitleText, { marginTop: 16 }]}>METODE PEMBAYARAN</Text>
              <View style={styles.paymentMethodList}>
                {[
                  { id: 'qris' as const, label: 'QRIS Instan (GoPay, OVO, ShopeePay)', icon: 'qr-code-outline' },
                  { id: 'bca' as const, label: 'Virtual Account BCA', icon: 'card-outline' },
                  { id: 'mandiri' as const, label: 'Virtual Account Mandiri', icon: 'card-outline' },
                  { id: 'retail' as const, label: 'Gerai Indomaret / Alfamart', icon: 'storefront-outline' },
                ].map((m) => {
                  const isSelected = selectedTopUpMethod === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.methodRow, isSelected && styles.methodRowActive]}
                      onPress={() => setSelectedTopUpMethod(m.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.methodRowLeft}>
                        <Ionicons name={m.icon as any} size={18} color={isSelected ? '#00B14F' : '#64748B'} />
                        <Text style={[styles.methodLabel, isSelected && styles.methodLabelActive]}>
                          {m.label}
                        </Text>
                      </View>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSelected ? '#00B14F' : '#CBD5E1'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* CTA Top-Up */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleConfirmTopUp}
                disabled={isProcessingTopUp}
                activeOpacity={0.85}
              >
                {isProcessingTopUp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="flash" size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>
                      Isi Saldo Rp {selectedTopUpAmount.toLocaleString('id-ID')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. MODAL PUSAT BANTUAN & WHATSAPP CS                                     */}
      {/* ========================================================================= */}
      <Modal
        visible={isHelpOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsHelpOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pusat Bantuan 24/7</Text>
              <TouchableOpacity onPress={() => setIsHelpOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalContent}>
              {/* WhatsApp Live CS Button */}
              <TouchableOpacity
                style={styles.waContactCard}
                onPress={handleOpenWhatsAppSupport}
                activeOpacity={0.88}
              >
                <View style={styles.waIconWrap}>
                  <Ionicons name="logo-whatsapp" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.waTextCol}>
                  <Text style={styles.waTitle}>Hubungi CS via WhatsApp</Text>
                  <Text style={styles.waSubtitle}>
                    Respon cepat dalam hitungan detik. Siap membantu kendala pesanan Anda.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#00873D" />
              </TouchableOpacity>

              {/* FAQ Accordion List */}
              <Text style={[styles.sectionSubtitleText, { marginTop: 20 }]}>PERTANYAAN UMUM (FAQ)</Text>

              {[
                {
                  q: 'Bagaimana jika mitra barber terlambat datang?',
                  a: 'Jika mitra terlambat lebih dari 15 menit dari estimasi waktu tiba (ETA), Anda berhak membatalkan pesanan tanpa biaya pembatalan atau menghubungi barber langsung melalui nomor kontak pada aplikasi.',
                },
                {
                  q: 'Apakah saya bisa membayar menggunakan uang tunai (COD)?',
                  a: 'Ya, Anda dapat memilih metode pembayaran Tunai (COD) saat konfirmasi pesanan dan membayarkannya langsung kepada barber setelah cukur selesai.',
                },
                {
                  q: 'Bagaimana standar kebersihan alat cukur?',
                  a: 'Seluruh mitra barber Hometik wajib mensterilkan alat cukur menggunakan disinfektan dan menggunakan cape sekali pakai/steril sebelum melayani pelanggan.',
                },
                {
                  q: 'Bagaimana cara membatalkan pesanan?',
                  a: 'Buka tab Aktivitas, pilih pesanan yang sedang berlangsung, dan tekan tombol "Batalkan Pesanan". Pembatalan gratis sebelum barber berangkat.',
                },
              ].map((faq, idx) => (
                <View key={idx} style={styles.faqCard}>
                  <View style={styles.faqHeaderRow}>
                    <Ionicons name="help-circle" size={16} color="#00B14F" />
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                  </View>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 5. MODAL INFORMASI MITRA BARBER                                          */}
      {/* ========================================================================= */}
      <Modal
        visible={isMitraInfoOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsMitraInfoOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gabung Mitra Barber Hometik</Text>
              <TouchableOpacity onPress={() => setIsMitraInfoOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalContent}>
              <View style={styles.mitraModalBanner}>
                <Ionicons name="trophy" size={36} color="#00B14F" />
                <Text style={styles.mitraModalTitle}>Peluang Karir Barber Mandiri</Text>
                <Text style={styles.mitraModalSubtitle}>
                  Bergabunglah dengan ratusan master barber di kota Anda dan nikmati kebebasan mengatur jadwal kerja sendiri.
                </Text>
              </View>

              <View style={styles.benefitList}>
                {[
                  { icon: 'cash-outline', title: 'Bagi Hasil Hingga 85%', desc: 'Pendapatan langsung masuk ke dompet mitra dan dapat ditarik harian.' },
                  { icon: 'time-outline', title: 'Waktu Kerja Fleksibel', desc: 'Atur kapan Anda online dan siap menerima panggilan cukur.' },
                  { icon: 'shield-outline', title: 'Asuransi & Pelatihan', desc: 'Dapatkan sertifikasi teknik potong rambut tren modern gratis.' },
                ].map((b, idx) => (
                  <View key={idx} style={styles.benefitRow}>
                    <View style={styles.benefitIconWrap}>
                      <Ionicons name={b.icon as any} size={18} color="#00B14F" />
                    </View>
                    <View style={styles.benefitTextCol}>
                      <Text style={styles.benefitTitle}>{b.title}</Text>
                      <Text style={styles.benefitDesc}>{b.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  setIsMitraInfoOpen(false);
                  handleOpenWhatsAppSupport();
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Daftar via WhatsApp Rekrutmen</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 6. MODAL GANTI KATA SANDI                                                 */}
      {/* ========================================================================= */}
      <Modal
        visible={isChangePasswordOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsChangePasswordOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ganti Kata Sandi Akun</Text>
              <TouchableOpacity onPress={() => setIsChangePasswordOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalContent}>
              <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                Perbarui kata sandi akun Anda untuk menjaga keamanan data dan privasi pesanan.
              </Text>

              {/* Input Kata Sandi Baru */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kata Sandi Baru</Text>
                <View style={styles.textInputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInputField}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={{ padding: 4 }}>
                    <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Input Konfirmasi Kata Sandi Baru */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Konfirmasi Kata Sandi Baru</Text>
                <View style={styles.textInputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInputField}
                    placeholder="Ulangi kata sandi baru"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showNewPassword}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!newPassword || newPassword !== confirmNewPassword || isChangingPassword) && {
                    backgroundColor: '#94A3B8',
                  },
                ]}
                onPress={handleChangePassword}
                disabled={!newPassword || newPassword !== confirmNewPassword || isChangingPassword}
                activeOpacity={0.85}
              >
                {isChangingPassword ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Simpan Kata Sandi Baru</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  guestBanner: {
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  guestBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  guestBannerTextCol: {
    flex: 1,
  },
  guestBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00873D',
  },
  guestBannerSubtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  guestLoginBtn: {
    backgroundColor: '#00B14F',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.full,
    marginLeft: 8,
  },
  guestLoginBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    borderRadius: 38,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00B14F',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    gap: 5,
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.6,
  },
  quickEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
  },
  quickEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B14F',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
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
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  mitraBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: THEME.borderRadius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  mitraBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  mitraIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mitraTextCol: {
    flex: 1,
  },
  mitraBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  mitraBannerSubtitle: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
    lineHeight: 15,
  },
  section: {
    marginBottom: THEME.spacing.md,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: THEME.spacing.xs,
    paddingHorizontal: 4,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: THEME.spacing.lg,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: THEME.borderRadius.xl,
    paddingVertical: 13,
    gap: 8,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
  },

  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  editAvatarPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#00B14F',
    marginBottom: 6,
  },
  avatarHint: {
    fontSize: 11,
    color: '#64748B',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  textInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  textInputField: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#00B14F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Address Modal Styles
  addressItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  addressItemCardActive: {
    borderColor: '#00B14F',
    backgroundColor: '#F0FDF4',
  },
  addressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressLabelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  primaryBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  addressFullText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  addressLandmarkText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  setPrimaryBtn: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  setPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B14F',
  },
  addAddressTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#00B14F',
    borderRadius: 12,
    marginTop: 6,
  },
  addAddressTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B14F',
  },
  newAddressBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  newAddressBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  addAddressBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelAddressBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelAddressBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  saveAddressBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#00B14F',
  },
  saveAddressBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Wallet Modal Styles
  walletCard: {
    backgroundColor: '#00873D',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletCardBrand: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  walletBalanceLabel: {
    fontSize: 11,
    color: '#E8F8F0',
  },
  walletBalanceAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 4,
  },
  walletCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 8,
  },
  walletCardUser: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E8F8F0',
  },
  walletCardStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  sectionSubtitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  topUpGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  topUpChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topUpChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B14F',
  },
  topUpChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  topUpChipTextActive: {
    color: '#00B14F',
    fontWeight: '800',
  },
  paymentMethodList: {
    gap: 8,
    marginBottom: 14,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodRowActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#00B14F',
  },
  methodRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  methodLabelActive: {
    color: '#00873D',
    fontWeight: '700',
  },

  // Help Modal Styles
  waContactCard: {
    backgroundColor: '#00873D',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  waIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waTextCol: {
    flex: 1,
  },
  waTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  waSubtitle: {
    fontSize: 11,
    color: '#DCFCE7',
    marginTop: 2,
    lineHeight: 15,
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  faqQuestion: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    paddingLeft: 22,
  },

  // Mitra Modal Styles
  mitraModalBanner: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  mitraModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    marginTop: 8,
  },
  mitraModalSubtitle: {
    fontSize: 11,
    color: '#166534',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  benefitList: {
    gap: 12,
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  benefitDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});
