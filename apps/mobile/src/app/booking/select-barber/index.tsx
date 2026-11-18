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
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useNearbyBarbers, NearbyBarberOption } from '@/hooks/use-nearby-barbers';
import { useCreateBooking } from '@/hooks/use-bookings';
import { THEME } from '@/constants/theme';

export default function SelectBarberScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    serviceId?: string;
    serviceName?: string;
    price?: string;
  }>();

  const serviceName = params.serviceName || 'Barber Kilat On-Demand';
  const basePrice = params.price ? parseInt(params.price, 10) : 85000;

  const { session, isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | 'closest' | 'top-rated' | 'master-barber'>('all');
  const [selectedBarber, setSelectedBarber] = useState<NearbyBarberOption | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'hometikpay' | 'qris' | 'cash'>('hometikpay');
  const [userAddress, setUserAddress] = useState('Jl. Pemuda No. 45, Genteng, Surabaya');
  const [addressNotes, setAddressNotes] = useState('Rumah cat putih pagar hitam, bel di samping pintu.');

  // Fetch nearby online barbers
  const { data: barbers = [], isLoading: isLoadingBarbers } = useNearbyBarbers();
  const { mutate: createBooking, isPending: isCreatingBooking } = useCreateBooking();

  // Filter barbers by active filter
  const filteredBarbers = useMemo(() => {
    return barbers.filter((barber) => {
      if (activeFilter === 'closest') return (barber.distanceKm || 0) <= 2.5;
      if (activeFilter === 'top-rated') return barber.rating >= 4.9;
      if (activeFilter === 'master-barber') return barber.badge?.includes('MASTER') || barber.specialty.includes('Master');
      return true;
    });
  }, [barbers, activeFilter]);

  const handleSelectBarber = (barber: NearbyBarberOption) => {
    // Check route guard: must be authenticated
    if (!session || !isAuthenticated) {
      Alert.alert(
        'Login Diperlukan',
        'Silakan masuk atau daftar terlebih dahulu untuk memanggil barber pilihan Anda.',
        [
          { text: 'Nanti', style: 'cancel' },
          { text: 'Masuk Sekarang', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    setSelectedBarber(barber);
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedBarber) return;

    const travelFee = 10000;
    const discount = 15000; // Promo voucher diskon
    const totalPrice = basePrice + travelFee - discount;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedBarber.id);
    const assignedBarberId = isUUID ? selectedBarber.id : null;

    createBooking(
      {
        service_type: `${serviceName} (Pilihan Mitra: ${selectedBarber.name})`,
        notes: `Barber: ${selectedBarber.name}. Patokan: ${addressNotes}. Metode Bayar: ${paymentMethod.toUpperCase()}`,
        total_price: totalPrice,
        scheduled_at: new Date().toISOString(),
        barber_id: assignedBarberId,
        user_location: {
          latitude: -7.2656,
          longitude: 112.7483,
          address: userAddress,
        },
      },
      {
        onSuccess: (booking) => {
          setIsCheckoutModalOpen(false);
          const successMsg = `Panggilan berhasil dikirim langsung ke ${selectedBarber.name}! Estimasi tiba dalam ${selectedBarber.etaText}.`;
          if (Platform.OS === 'web') {
            window.alert(successMsg);
          } else {
            Alert.alert('Mitra Terhubung!', successMsg);
          }
          router.replace('/(tabs)/bookings');
        },
        onError: (err: any) => {
          const errText = err?.message || 'Gagal membuat pesanan. Silakan coba kembali.';
          if (Platform.OS === 'web') {
            window.alert(`Error: ${errText}`);
          } else {
            Alert.alert('Gagal Memesan', errText);
          }
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Navigation Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.topHeaderTitleWrap}>
          <Text style={styles.topHeaderTitle}>Pilih Barber di Sekitar</Text>
          <Text style={styles.topHeaderSubtitle}>{serviceName}</Text>
        </View>
        <View style={styles.topHeaderRight}>
          <View style={styles.livePulseDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Delivery Address Pill */}
      <View style={styles.addressBar}>
        <Ionicons name="location" size={18} color="#00B14F" />
        <View style={styles.addressTextCol}>
          <Text style={styles.addressLabel}>Alamat Panggilan Barber</Text>
          <Text style={styles.addressValue} numberOfLines={1}>
            {userAddress}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'web') {
              const newAddr = window.prompt('Ubah alamat panggilan:', userAddress);
              if (newAddr) setUserAddress(newAddr);
            } else {
              Alert.prompt('Ubah Alamat', 'Masukkan alamat pengantaran baru:', [
                { text: 'Batal', style: 'cancel' },
                { text: 'Simpan', onPress: (val) => val && setUserAddress(val) },
              ]);
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.changeAddressText}>Ubah</Text>
        </TouchableOpacity>
      </View>

      {/* Online Status Info Strip */}
      <View style={styles.radarStrip}>
        <MaterialIcons name="radar" size={18} color="#00B14F" />
        <Text style={styles.radarText}>
          Ditemukan <Text style={styles.boldText}>{filteredBarbers.length} Barber Aktif</Text> di area sekitar Anda
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { id: 'all' as const, label: 'Semua Barber' },
            { id: 'closest' as const, label: '⚡ Terdekat (< 2.5 km)' },
            { id: 'top-rated' as const, label: '⭐ Rating 4.9+' },
            { id: 'master-barber' as const, label: '✂️ Master Barber' },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Barbers List */}
      {isLoadingBarbers ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#00B14F" />
          <Text style={styles.loadingText}>Mendeteksi barber yang sedang online...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.barbersScroll}
        >
          {filteredBarbers.map((barber) => (
            <View key={barber.id} style={styles.barberCard}>
              <View style={styles.cardMainRow}>
                {/* Avatar with Online Dot */}
                <View style={styles.avatarWrap}>
                  <Image source={{ uri: barber.avatarUrl }} style={styles.avatarImage} />
                  <View style={styles.onlineBadge}>
                    <View style={styles.greenDot} />
                  </View>
                </View>

                {/* Details */}
                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.barberName} numberOfLines={1}>
                      {barber.name}
                    </Text>
                    <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                  </View>

                  <Text style={styles.specialtyText}>{barber.specialty}</Text>

                  {/* Rating & Distance Meta */}
                  <View style={styles.metaRow}>
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={styles.ratingNumber}>{barber.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.metaSeparator}>•</Text>
                    <View style={styles.distanceWrap}>
                      <Ionicons name="navigate-outline" size={12} color="#00B14F" />
                      <Text style={styles.distanceText}>
                        {barber.distanceKm} km ({barber.etaText})
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Bottom Row: Price & Call CTA */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.footerPriceLabel}>Total Estimasi</Text>
                  <Text style={styles.footerPriceValue}>
                    Rp {(basePrice + 10000).toLocaleString('id-ID')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => handleSelectBarber(barber)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.selectBtnText}>Pilih & Panggil</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Checkout & Confirmation Sheet Modal */}
      <Modal
        visible={isCheckoutModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCheckoutModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.sheetHandle} />
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>Konfirmasi Pemesanan</Text>
                <TouchableOpacity
                  onPress={() => setIsCheckoutModalOpen(false)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedBarber && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                {/* Selected Barber Card */}
                <View style={styles.selectedBarberBox}>
                  <Image source={{ uri: selectedBarber.avatarUrl }} style={styles.smallAvatar} />
                  <View style={styles.selectedBarberInfo}>
                    <Text style={styles.selectedBarberName}>{selectedBarber.name}</Text>
                    <Text style={styles.selectedBarberSub}>
                      {selectedBarber.specialty} • ⭐ {selectedBarber.rating.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.etaPill}>
                    <Ionicons name="flash" size={12} color="#00873D" />
                    <Text style={styles.etaPillText}>{selectedBarber.etaText}</Text>
                  </View>
                </View>

                {/* Service Details */}
                <View style={styles.summarySection}>
                  <Text style={styles.summarySectionTitle}>RINCIAN LAYANAN</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Paket Layanan</Text>
                    <Text style={styles.summaryVal}>{serviceName}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Biaya Layanan</Text>
                    <Text style={styles.summaryVal}>Rp {basePrice.toLocaleString('id-ID')}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Biaya Perjalanan Mitra</Text>
                    <Text style={styles.summaryVal}>Rp 10.000</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: '#00B14F' }]}>Voucher Kupon Diskon</Text>
                    <Text style={[styles.summaryVal, { color: '#00B14F' }]}>-Rp 15.000</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryTotalLabel}>Total Tagihan</Text>
                    <Text style={styles.summaryTotalVal}>
                      Rp {(basePrice + 10000 - 15000).toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>

                {/* Address Notes Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.summarySectionTitle}>CATATAN PATOKAN RUMAH</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={addressNotes}
                    onChangeText={setAddressNotes}
                    placeholder="Contoh: Pagar hitam, dekat pos satpam..."
                    placeholderTextColor="#94A3B8"
                    multiline
                  />
                </View>

                {/* Payment Method Selector */}
                <View style={styles.paymentSection}>
                  <Text style={styles.summarySectionTitle}>METODE PEMBAYARAN</Text>
                  {[
                    { id: 'hometikpay' as const, title: 'HometikPay', sub: 'Saldo: Rp 245.000 (Cukup)', icon: 'wallet' },
                    { id: 'qris' as const, title: 'QRIS Instan', sub: 'BCA, Mandiri, GoPay, OVO', icon: 'qr-code' },
                    { id: 'cash' as const, title: 'Tunai (COD)', sub: 'Bayar langsung ke barber', icon: 'cash' },
                  ].map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <TouchableOpacity
                        key={pm.id}
                        style={[styles.paymentItem, isSelected && styles.paymentItemActive]}
                        onPress={() => setPaymentMethod(pm.id)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={pm.icon as any}
                          size={20}
                          color={isSelected ? '#00B14F' : '#64748B'}
                        />
                        <View style={styles.paymentInfo}>
                          <Text style={[styles.paymentTitle, isSelected && styles.paymentTitleActive]}>
                            {pm.title}
                          </Text>
                          <Text style={styles.paymentSub}>{pm.sub}</Text>
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

                <View style={{ height: 24 }} />
              </ScrollView>
            )}

            {/* Modal Bottom CTA */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmBtn, isCreatingBooking && styles.confirmBtnDisabled]}
                onPress={handleConfirmBooking}
                disabled={isCreatingBooking}
                activeOpacity={0.88}
              >
                {isCreatingBooking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmBtnText}>Konfirmasi & Panggil Sekarang</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topHeaderTitleWrap: {
    flex: 1,
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  topHeaderSubtitle: {
    fontSize: 12,
    color: '#00B14F',
    fontWeight: '600',
    marginTop: 1,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B14F',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00873D',
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  addressTextCol: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  addressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  changeAddressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00B14F',
  },
  radarStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  radarText: {
    fontSize: 12,
    color: '#475569',
  },
  boldText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  filterRow: {
    marginVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  barbersScroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 32,
    gap: 12,
  },
  barberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00B14F',
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  barberName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  specialtyText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ratingNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  metaSeparator: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  distanceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00B14F',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerPriceLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  footerPriceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B14F',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bottomSpacer: {
    height: 24,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 10,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  selectedBarberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 12,
  },
  smallAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  selectedBarberInfo: {
    flex: 1,
  },
  selectedBarberName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedBarberSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  etaPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00873D',
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  summarySectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00B14F',
  },
  inputSection: {
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 12,
    color: '#0F172A',
    minHeight: 50,
  },
  paymentSection: {
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 12,
  },
  paymentItemActive: {
    borderColor: '#00B14F',
    backgroundColor: '#F0FDF4',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentTitleActive: {
    color: '#00873D',
  },
  paymentSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confirmBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00B14F',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
