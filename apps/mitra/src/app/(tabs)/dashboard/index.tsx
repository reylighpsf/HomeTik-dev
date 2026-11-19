import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BookingStatus } from '@hometik/shared-types';
import { useMitraAuth } from '@/context/MitraAuthContext';
import { useMitraLocation } from '@/hooks/use-mitra-location';
import { useMitraOrders, type MitraBooking } from '@/hooks/use-mitra-orders';
import { MITRA_THEME } from '@/constants/theme';

const formatCurrency = (amount: number) =>
  `Rp ${Math.round(amount).toLocaleString('id-ID')}`;

const formatShortCurrency = (amount: number) => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}K`;
  return String(amount);
};

const NEXT_STEP: Record<
  string,
  { nextStatus: BookingStatus; label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  ACCEPTED: {
    nextStatus: 'IN_TRANSIT',
    label: 'Berangkat ke Lokasi (OTW)',
    icon: 'navigate-outline',
  },
  IN_TRANSIT: {
    nextStatus: 'IN_PROGRESS',
    label: 'Tiba & Mulai Pengerjaan Cukur',
    icon: 'cut-outline',
  },
  IN_PROGRESS: {
    nextStatus: 'COMPLETED',
    label: 'Selesaikan Pesanan',
    icon: 'checkmark-done-circle-outline',
  },
};

export default function MitraDashboardScreen() {
  const { profile, barberDetails } = useMitraAuth();
  const { isOnline, coords, lastSyncedAt, isToggling, locationError, toggleOnline } =
    useMitraLocation();
  const {
    incomingOrders,
    activeJob,
    completedOrders,
    todayEarnings,
    isRefetching,
    refetch,
    isUpdating,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
  } = useMitraOrders();

  const [sterilKitVisible, setSterilKitVisible] = useState(false);

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
    else Alert.alert(title, msg);
  };

  const openGoogleMaps = (booking: MitraBooking) => {
    const loc = booking.user_location;
    if (!loc?.latitude || !loc?.longitude) {
      notify('Lokasi Tidak Tersedia', 'Koordinat GPS pelanggan belum tersedia.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`;
    Linking.openURL(url);
  };

  const openCustomerWhatsApp = (booking: MitraBooking) => {
    const rawPhone = booking.user?.phone || '';
    if (!rawPhone) {
      notify('Nomor WA Kosong', 'Pelanggan belum mencantumkan nomor WhatsApp.');
      return;
    }
    let formatted = rawPhone.replace(/[^\d]/g, '');
    if (formatted.startsWith('0')) formatted = '62' + formatted.slice(1);
    const message = encodeURIComponent(
      `Halo Kak ${booking.user?.name || ''}, saya ${profile?.name || 'Mitra HomeTik'} untuk pesanan layanan ${booking.service_type}. Saya akan segera menuju lokasi ya!`
    );
    Linking.openURL(`https://wa.me/${formatted}?text=${message}`);
  };

  const openSupportWhatsApp = () => {
    const message = encodeURIComponent(
      `Halo Tim Support HomeTik, saya Mitra ${profile?.name || ''} membutuhkan bantuan operasional.`
    );
    Linking.openURL(`https://wa.me/6281234567890?text=${message}`);
  };

  const handleAccept = async (bookingId: string) => {
    try {
      await acceptOrder(bookingId);
      notify('Pesanan Diterima ✅', 'Silakan bersiap dan tekan Berangkat (OTW) saat mulai jalan.');
    } catch (e: any) {
      notify('Gagal Menerima', e?.message || 'Tidak dapat menerima pesanan.');
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      await rejectOrder(bookingId);
    } catch (e: any) {
      notify('Gagal Menolak', e?.message || 'Tidak dapat menolak pesanan.');
    }
  };

  const handleAdvanceStatus = async (booking: MitraBooking) => {
    const step = NEXT_STEP[booking.status];
    if (!step) return;
    try {
      await updateOrderStatus(booking.id, step.nextStatus);
      if (step.nextStatus === 'COMPLETED') {
        notify('Pesanan Selesai! 🎉', 'Pendapatan bersih 85% telah ditambahkan ke Dompet Mitra.');
      }
    } catch (e: any) {
      notify('Gagal Update Status', e?.message || 'Silakan coba lagi.');
    }
  };

  const completedCount = completedOrders.length;
  const ratingValue = Number(barberDetails?.rating ?? 4.9).toFixed(1);
  const displayRevenue = todayEarnings > 0 ? formatShortCurrency(todayEarnings) : '350K';
  const displayOrdersCount = todayEarnings > 0 ? completedCount : 4;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* 1. Top Bar */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={styles.headerDot} />
          <Text style={styles.headerTitle}>Mitra Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.onlineChip, isOnline ? styles.onlineChipActive : styles.onlineChipInactive]}>
            <View style={[styles.onlineChipDot, isOnline ? styles.dotActive : styles.dotInactive]} />
            <Text style={[styles.onlineChipText, isOnline ? styles.textActive : styles.textInactive]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={17} color={MITRA_THEME.colors.textInverse} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={MITRA_THEME.colors.primary}
          />
        }
      >
        {/* 2. Mitra Greeting & Quick Status Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileMainRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={
                  profile?.avatar_url
                    ? { uri: profile.avatar_url }
                    : require('../../../../assets/default-avatar.png')
                }
                style={styles.avatarImg}
              />
              <View style={[styles.avatarStatusBadge, isOnline ? styles.badgeGreen : styles.badgeGray]} />
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {profile?.name || 'Rian Pratama'}
                </Text>
                <View style={styles.proChip}>
                  <Text style={styles.proChipText}>PRO</Text>
                </View>
              </View>

              <View style={styles.statsMetaRow}>
                <View style={styles.ratingMeta}>
                  <Ionicons name="star" size={13} color={MITRA_THEME.colors.primary} />
                  <Text style={styles.ratingText}> {ratingValue}</Text>
                </View>
                <View style={styles.metaDivider} />
                <Text style={styles.orderCountText}>{displayOrdersCount > 0 ? `${displayOrdersCount} order` : '342 order'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => notify('Notifikasi', 'Tidak ada pemberitahuan baru saat ini.')}
            >
              <Ionicons name="notifications-outline" size={20} color={MITRA_THEME.colors.textPrimary} />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
          </View>

          {/* Active Area Chip Row */}
          <View style={styles.areaChipRow}>
            <View style={styles.areaPill}>
              <Ionicons name="location" size={15} color={MITRA_THEME.colors.primary} />
              <Text style={styles.areaPillBold}>
                {coords ? 'Surabaya Pusat' : 'Area Layanan'}
              </Text>
              <Text style={styles.areaPillSub}> · Siap Bergerak</Text>
            </View>
            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={14} color={MITRA_THEME.colors.primary} />
              <Text style={styles.verifiedText}>Mitra Aktif</Text>
            </View>
          </View>
        </View>

        {/* 3. Master Online/Offline Status Panel */}
        <View style={[styles.masterCard, isOnline && styles.masterCardOnline]}>
          <View style={styles.masterMainRow}>
            <View style={styles.masterLeft}>
              <View style={[styles.beaconIconBox, isOnline ? styles.beaconActive : styles.beaconInactive]}>
                <Ionicons
                  name={isOnline ? 'radio-outline' : 'power-outline'}
                  size={24}
                  color={isOnline ? MITRA_THEME.colors.primary : MITRA_THEME.colors.textMuted}
                />
              </View>
              <View style={styles.beaconTextCol}>
                <Text style={styles.statusMasterTitle}>
                  {isOnline ? 'ONLINE — Siap Order' : 'OFFLINE — Istirahat'}
                </Text>
                <View style={styles.radarMetaRow}>
                  <View style={[styles.radarDot, isOnline ? styles.dotGreen : styles.dotGray]} />
                  <Text style={styles.radarMetaText}>
                    {isOnline
                      ? 'Jangkauan radar: '
                      : 'Aktifkan untuk menerima panggilan '}
                    <Text style={styles.radarMetaBold}>{isOnline ? '6.0 km' : 'pelanggan'}</Text>
                  </Text>
                </View>
              </View>
            </View>

            {isToggling ? (
              <ActivityIndicator color={MITRA_THEME.colors.primary} />
            ) : (
              <Switch
                value={isOnline}
                onValueChange={toggleOnline}
                trackColor={{ false: MITRA_THEME.colors.surfaceContainerHigh, true: MITRA_THEME.colors.primary }}
                thumbColor="#FFFFFF"
              />
            )}
          </View>

          <View style={styles.responseSpeedBox}>
            <View style={styles.speedLabelRow}>
              <Ionicons name="speedometer-outline" size={16} color={MITRA_THEME.colors.primary} />
              <Text style={styles.speedLabel}>Waktu respon rata-rata</Text>
            </View>
            <Text style={styles.speedValue}>1.2 Menit</Text>
          </View>
        </View>

        {/* 4. Minimalist Metrics Grid (3 Kolom) */}
        <View style={styles.metricsGrid}>
          {/* Metric 1: Hari Ini */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Hari Ini</Text>
            <View style={styles.metricValueWrap}>
              <Text style={styles.metricValue}>{displayRevenue}</Text>
              <Text style={styles.metricSub}>{displayOrdersCount} Order</Text>
            </View>
            <View style={styles.metricTrendRow}>
              <Ionicons name="trending-up" size={13} color={MITRA_THEME.colors.primary} />
              <Text style={styles.metricTrendText}>+12%</Text>
            </View>
          </View>

          {/* Metric 2: Penerimaan */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Penerimaan</Text>
            <View style={styles.metricValueWrap}>
              <Text style={styles.metricValue}>95%</Text>
              <Text style={styles.metricSub}>{displayOrdersCount}/5 Selesai</Text>
            </View>
            <View style={styles.metricTrendRow}>
              <Ionicons name="checkmark-circle" size={13} color={MITRA_THEME.colors.primary} />
              <Text style={[styles.metricTrendText, { color: MITRA_THEME.colors.textSecondary }]}>
                Optimal
              </Text>
            </View>
          </View>

          {/* Metric 3: Kepuasan */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Rating</Text>
            <View style={styles.metricValueWrap}>
              <Text style={styles.metricValue}>{ratingValue}</Text>
              <Text style={styles.metricSub}>100% Puas</Text>
            </View>
            <View style={styles.metricTrendRow}>
              <Ionicons name="thumbs-up" size={13} color={MITRA_THEME.colors.primary} />
              <Text style={styles.metricTrendText}>Sempurna</Text>
            </View>
          </View>
        </View>

        {/* Incoming Orders Alert Card (Jika Ada Order Masuk) */}
        {incomingOrders.length > 0 ? (
          <View style={styles.incomingSection}>
            <View style={styles.incomingHeader}>
              <View style={styles.incomingBadgePulse}>
                <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
                <Text style={styles.incomingBadgeText}>
                  {incomingOrders.length} Pesanan Masuk Sekitar Anda!
                </Text>
              </View>
            </View>

            {incomingOrders.map((order) => (
              <View key={order.id} style={styles.incomingCard}>
                <View style={styles.incomingCardTop}>
                  <View>
                    <Text style={styles.incomingService}>{order.service_type}</Text>
                    <Text style={styles.incomingCustomer}>
                      Pemesan: {order.user?.name || 'Pelanggan HomeTik'}
                    </Text>
                  </View>
                  <Text style={styles.incomingPrice}>
                    {formatCurrency(Number(order.total_price))}
                  </Text>
                </View>

                <View style={styles.incomingAddressRow}>
                  <Ionicons name="location-outline" size={16} color={MITRA_THEME.colors.primary} />
                  <Text style={styles.incomingAddressText} numberOfLines={2}>
                    {order.user_location?.address || 'Koordinat GPS Pelanggan'}
                  </Text>
                </View>

                <View style={styles.incomingActionRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleReject(order.id)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.rejectBtnText}>Tolak</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(order.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
                        <Text style={styles.acceptBtnText}>Terima Pesanan</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Active Job Stepper Card (Pekerjaan Sedang Berlangsung) */}
        {activeJob ? (
          <View style={styles.activeJobSection}>
            <View style={styles.activeJobHeaderRow}>
              <Text style={styles.activeJobTitle}>🔥 Pekerjaan Aktif Saat Ini</Text>
              <View style={styles.jobStatusPill}>
                <Text style={styles.jobStatusPillText}>{activeJob.status}</Text>
              </View>
            </View>

            <View style={styles.activeJobCard}>
              <View style={styles.jobInfoRow}>
                <View>
                  <Text style={styles.jobServiceTitle}>{activeJob.service_type}</Text>
                  <Text style={styles.jobCustomerName}>
                    Klien: {activeJob.user?.name || 'Pelanggan HomeTik'}
                  </Text>
                </View>
                <Text style={styles.jobTotalAmount}>
                  {formatCurrency(Number(activeJob.total_price))}
                </Text>
              </View>

              <View style={styles.jobAddressBox}>
                <Ionicons name="location" size={16} color={MITRA_THEME.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobAddressText}>
                    {activeJob.user_location?.address || 'Lokasi alamat pelanggan'}
                  </Text>
                  {activeJob.notes ? (
                    <Text style={styles.jobNotesText}>Catatan: {activeJob.notes}</Text>
                  ) : null}
                </View>
              </View>

              {/* Quick Actions: Navigation & WhatsApp */}
              <View style={styles.jobQuickActions}>
                <TouchableOpacity
                  style={styles.mapsBtn}
                  onPress={() => openGoogleMaps(activeJob)}
                >
                  <Ionicons name="map-outline" size={16} color={MITRA_THEME.colors.info} />
                  <Text style={styles.mapsBtnText}>Buka Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() => openCustomerWhatsApp(activeJob)}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#15803D" />
                  <Text style={styles.waBtnText}>Chat Pelanggan</Text>
                </TouchableOpacity>
              </View>

              {/* Next Step Stepper Action */}
              {NEXT_STEP[activeJob.status] ? (
                <TouchableOpacity
                  style={styles.stepperActionBtn}
                  onPress={() => handleAdvanceStatus(activeJob)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={NEXT_STEP[activeJob.status].icon}
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.stepperActionText}>
                        {NEXT_STEP[activeJob.status].label}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* 5. Target Insentif Harian Progress Card */}
        <View style={styles.incentiveCard}>
          <View style={styles.incentiveHeader}>
            <View style={styles.incentiveLeft}>
              <View style={styles.medalBox}>
                <Ionicons name="ribbon-outline" size={18} color={MITRA_THEME.colors.primary} />
              </View>
              <View>
                <Text style={styles.incentiveTitle}>Target Insentif Harian</Text>
                <Text style={styles.incentiveSub}>4 dari 5 Order tercapai</Text>
              </View>
            </View>
            <View style={styles.incentiveBonusBadge}>
              <Text style={styles.incentiveBonusText}>+Rp 50.000</Text>
            </View>
          </View>

          {/* Progress Meter Bar */}
          <View style={styles.meterWrap}>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: '80%' }]} />
            </View>
            <View style={styles.meterFooter}>
              <Text style={styles.meterLeftInfo}>
                <Ionicons name="flash" size={13} color={MITRA_THEME.colors.primary} />
                {' 1 order lagi untuk klaim bonus!'}
              </Text>
              <Text style={styles.meterRightTime}>Berakhir 23:59</Text>
            </View>
          </View>
        </View>

        {/* 6. Clean Map & Heatmap Widget (Live) */}
        <View style={styles.heatmapCard}>
          <View style={styles.heatmapHeader}>
            <View>
              <Text style={styles.heatmapTitle}>Heatmap Permintaan</Text>
              <Text style={styles.heatmapSub}>Update terkini area Surabaya Pusat</Text>
            </View>
            <View style={styles.liveChip}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveChipText}>Live</Text>
            </View>
          </View>

          {/* Simulated Map Container */}
          <View style={styles.mapContainer}>
            <View style={styles.mapGridLines}>
              <View style={styles.gridLineHorizontal} />
              <View style={[styles.gridLineHorizontal, { top: '60%' }]} />
              <View style={styles.gridLineVertical} />
              <View style={[styles.gridLineVertical, { left: '70%' }]} />
            </View>

            {/* Radar Pin Mitra */}
            <View style={styles.radarBeaconCenter}>
              <View style={styles.beaconOuterRing}>
                <View style={styles.beaconInnerCircle}>
                  <Ionicons name="pin" size={17} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.beaconTag}>
                <Text style={styles.beaconTagText}>Anda Disini</Text>
              </View>
            </View>

            {/* Hotspot Card Overlay */}
            <View style={styles.hotspotOverlay}>
              <View style={styles.hotspotLeft}>
                <View style={styles.fireIconBox}>
                  <Ionicons name="flame" size={16} color={MITRA_THEME.colors.error} />
                </View>
                <View style={styles.hotspotInfo}>
                  <Text style={styles.hotspotTitle} numberOfLines={1}>
                    Hotspot Tunjungan
                  </Text>
                  <Text style={styles.hotspotSub} numberOfLines={1}>
                    Lonjakan pesanan Grooming
                  </Text>
                </View>
              </View>

              <View style={styles.hotspotRight}>
                <Text style={styles.surgeFeeText}>+Rp 15.000</Text>
                <Text style={styles.surgeFeeSub}>Surge Fee</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 7. Quick Actions Grid (3 Buttons) */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Aksi Cepat</Text>
          <View style={styles.quickActionsGrid}>
            {/* Button 1: Area Ramai */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => notify('Area Ramai', 'Area Tunjungan & Gubeng memiliki permintaan cukur tertinggi saat ini.')}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="map" size={20} color={MITRA_THEME.colors.primary} />
              </View>
              <Text style={styles.actionBtnLabel}>Area Ramai</Text>
            </TouchableOpacity>

            {/* Button 2: Steril Kit */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setSterilKitVisible(!sterilKitVisible)}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="sparkles" size={20} color={MITRA_THEME.colors.primary} />
              </View>
              <Text style={styles.actionBtnLabel}>Steril Kit</Text>
            </TouchableOpacity>

            {/* Button 3: Bantuan 24/7 */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={openSupportWhatsApp}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="headset" size={20} color={MITRA_THEME.colors.primary} />
              </View>
              <Text style={styles.actionBtnLabel}>Bantuan 24/7</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Steril Kit Checklist Modal/Card */}
        {sterilKitVisible ? (
          <View style={styles.sterilKitCard}>
            <View style={styles.sterilKitHeader}>
              <Ionicons name="checkmark-done-circle" size={18} color={MITRA_THEME.colors.primary} />
              <Text style={styles.sterilKitTitle}>Checklist Kebersihan &amp; Alat Steril</Text>
            </View>
            <Text style={styles.sterilItem}>✅ Clipper &amp; Trimmer telah disemprot desinfektan</Text>
            <Text style={styles.sterilItem}>✅ Gunting &amp; Sisir direndam larutan steril</Text>
            <Text style={styles.sterilItem}>✅ Cape Cukur bersih &amp; wangi untuk pelanggan baru</Text>
            <Text style={styles.sterilItem}>✅ Silet baru steril selalu digunakan per pelanggan</Text>
          </View>
        ) : null}

        {/* 8. Operational Advice / Tip of the day */}
        <TouchableOpacity
          style={styles.adviceCard}
          onPress={() => notify('Standar Pelayanan', 'Selalu tunjukkan silet baru yang dibuka di hadapan pelanggan sebelum mencukur!')}
        >
          <View style={styles.adviceLeft}>
            <Ionicons name="bulb-outline" size={22} color={MITRA_THEME.colors.primary} />
            <View style={styles.adviceTextCol}>
              <Text style={styles.adviceTitle}>Peralatan Lengkap &amp; Bersih</Text>
              <Text style={styles.adviceSub}>Cek kartu sterilisasi sebelum ke lokasi klien.</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={MITRA_THEME.colors.textMuted} />
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
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  onlineChipActive: {
    backgroundColor: MITRA_THEME.colors.primaryLight,
    borderColor: MITRA_THEME.colors.primaryFixedDim,
  },
  onlineChipInactive: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerHigh,
    borderColor: MITRA_THEME.colors.border,
  },
  onlineChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: MITRA_THEME.colors.primary,
  },
  dotInactive: {
    backgroundColor: MITRA_THEME.colors.textMuted,
  },
  onlineChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textActive: {
    color: MITRA_THEME.colors.primary,
  },
  textInactive: {
    color: MITRA_THEME.colors.textMuted,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MITRA_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  profileCard: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    ...MITRA_THEME.shadows.card,
  },
  profileMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeGreen: {
    backgroundColor: MITRA_THEME.colors.primary,
  },
  badgeGray: {
    backgroundColor: MITRA_THEME.colors.textMuted,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  proChip: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: MITRA_THEME.colors.primary,
    letterSpacing: 0.5,
  },
  statsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: MITRA_THEME.colors.primary,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: MITRA_THEME.colors.outlineVariant,
    marginHorizontal: 6,
  },
  orderCountText: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: MITRA_THEME.colors.error,
  },
  areaChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: MITRA_THEME.colors.borderSubtle,
  },
  areaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  areaPillBold: {
    fontSize: 11,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  areaPillSub: {
    fontSize: 11,
    color: MITRA_THEME.colors.textSecondary,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: MITRA_THEME.colors.primary,
  },
  masterCard: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: MITRA_THEME.colors.border,
    ...MITRA_THEME.shadows.card,
  },
  masterCardOnline: {
    borderColor: MITRA_THEME.colors.primaryFixedDim,
  },
  masterMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  beaconIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconActive: {
    backgroundColor: MITRA_THEME.colors.primaryLight,
  },
  beaconInactive: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerHigh,
  },
  beaconTextCol: {
    flex: 1,
  },
  statusMasterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  radarMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  radarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: MITRA_THEME.colors.primary,
  },
  dotGray: {
    backgroundColor: MITRA_THEME.colors.textMuted,
  },
  radarMetaText: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
  },
  radarMetaBold: {
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  responseSpeedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  speedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: MITRA_THEME.colors.textSecondary,
  },
  speedValue: {
    fontSize: 12,
    fontWeight: '700',
    color: MITRA_THEME.colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 14,
    padding: 12,
    ...MITRA_THEME.shadows.card,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MITRA_THEME.colors.textSecondary,
  },
  metricValueWrap: {
    marginVertical: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: MITRA_THEME.colors.textPrimary,
  },
  metricSub: {
    fontSize: 11,
    color: MITRA_THEME.colors.textMuted,
    marginTop: 1,
  },
  metricTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  metricTrendText: {
    fontSize: 11,
    fontWeight: '700',
    color: MITRA_THEME.colors.primary,
  },
  incomingSection: {
    gap: 10,
  },
  incomingHeader: {
    flexDirection: 'row',
  },
  incomingBadgePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MITRA_THEME.colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  incomingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  incomingCard: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: MITRA_THEME.colors.primary,
    ...MITRA_THEME.shadows.card,
  },
  incomingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  incomingService: {
    fontSize: 16,
    fontWeight: '800',
    color: MITRA_THEME.colors.textPrimary,
  },
  incomingCustomer: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
    marginTop: 2,
  },
  incomingPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: MITRA_THEME.colors.primary,
  },
  incomingAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  incomingAddressText: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
    flex: 1,
  },
  incomingActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: MITRA_THEME.colors.surfaceContainerHigh,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: MITRA_THEME.colors.textSecondary,
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: MITRA_THEME.colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeJobSection: {
    gap: 8,
  },
  activeJobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeJobTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MITRA_THEME.colors.textPrimary,
  },
  jobStatusPill: {
    backgroundColor: MITRA_THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jobStatusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: MITRA_THEME.colors.primary,
  },
  activeJobCard: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: MITRA_THEME.colors.primary,
    ...MITRA_THEME.shadows.card,
  },
  jobInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobServiceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MITRA_THEME.colors.textPrimary,
  },
  jobCustomerName: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
    marginTop: 2,
  },
  jobTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: MITRA_THEME.colors.primary,
  },
  jobAddressBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  jobAddressText: {
    fontSize: 12,
    fontWeight: '600',
    color: MITRA_THEME.colors.textPrimary,
  },
  jobNotesText: {
    fontSize: 11,
    color: MITRA_THEME.colors.warning,
    marginTop: 2,
  },
  jobQuickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  mapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: MITRA_THEME.colors.infoLight,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MITRA_THEME.colors.info,
  },
  waBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    borderRadius: 8,
  },
  waBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  stepperActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: MITRA_THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stepperActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  incentiveCard: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    ...MITRA_THEME.shadows.card,
  },
  incentiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  incentiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medalBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incentiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  incentiveSub: {
    fontSize: 11,
    color: MITRA_THEME.colors.textSecondary,
    marginTop: 1,
  },
  incentiveBonusBadge: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  incentiveBonusText: {
    fontSize: 13,
    fontWeight: '800',
    color: MITRA_THEME.colors.primary,
  },
  meterWrap: {
    marginTop: 12,
  },
  meterTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: MITRA_THEME.colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: MITRA_THEME.colors.primary,
    borderRadius: 4,
  },
  meterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  meterLeftInfo: {
    fontSize: 11,
    fontWeight: '600',
    color: MITRA_THEME.colors.primary,
  },
  meterRightTime: {
    fontSize: 11,
    color: MITRA_THEME.colors.textMuted,
  },
  heatmapCard: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    ...MITRA_THEME.shadows.card,
  },
  heatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heatmapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  heatmapSub: {
    fontSize: 11,
    color: MITRA_THEME.colors.textSecondary,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MITRA_THEME.colors.primary,
  },
  liveChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: MITRA_THEME.colors.primary,
  },
  mapContainer: {
    height: 180,
    borderRadius: 14,
    backgroundColor: '#EAE6F3',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapGridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '35%',
    height: 1.5,
    backgroundColor: '#DCD6E8',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '30%',
    width: 1.5,
    backgroundColor: '#DCD6E8',
  },
  radarBeaconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconOuterRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 105, 72, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconInnerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MITRA_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...MITRA_THEME.shadows.card,
  },
  beaconTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    ...MITRA_THEME.shadows.card,
  },
  beaconTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  hotspotOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...MITRA_THEME.shadows.card,
  },
  hotspotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  fireIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: MITRA_THEME.colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotInfo: {
    flex: 1,
  },
  hotspotTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  hotspotSub: {
    fontSize: 10,
    color: MITRA_THEME.colors.textSecondary,
  },
  hotspotRight: {
    alignItems: 'flex-end',
  },
  surgeFeeText: {
    fontSize: 11,
    fontWeight: '700',
    color: MITRA_THEME.colors.primary,
  },
  surgeFeeSub: {
    fontSize: 9,
    color: MITRA_THEME.colors.textMuted,
  },
  quickActionsSection: {
    gap: 8,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
    marginLeft: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    ...MITRA_THEME.shadows.card,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MITRA_THEME.colors.textPrimary,
  },
  sterilKitCard: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: MITRA_THEME.colors.primaryFixedDim,
    gap: 6,
    ...MITRA_THEME.shadows.card,
  },
  sterilKitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sterilKitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: MITRA_THEME.colors.primary,
  },
  sterilItem: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
    lineHeight: 18,
  },
  adviceCard: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  adviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  adviceTextCol: {
    flex: 1,
  },
  adviceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  adviceSub: {
    fontSize: 11,
    color: MITRA_THEME.colors.textSecondary,
    marginTop: 1,
  },
});
