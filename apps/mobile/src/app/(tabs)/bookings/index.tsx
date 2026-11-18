import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBookings } from '@/hooks/use-bookings';
import { THEME } from '@/constants/theme';
import type { Booking, BookingStatus } from '@hometik/shared-types';

type FilterTab = 'ALL' | 'ACTIVE' | 'COMPLETED';

export default function BookingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const { data: bookings, isLoading, isError, refetch, isRefetching } = useBookings();

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    if (activeTab === 'ALL') return bookings;
    if (activeTab === 'ACTIVE') {
      return bookings.filter(
        (b) =>
          b.status === 'PENDING' ||
          b.status === 'ACCEPTED' ||
          b.status === 'IN_TRANSIT' ||
          b.status === 'IN_PROGRESS'
      );
    }
    if (activeTab === 'COMPLETED') {
      return bookings.filter(
        (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED'
      );
    }
    return bookings;
  }, [bookings, activeTab]);

  const getStatusBadgeConfig = (status: BookingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: 'Selesai',
          bg: THEME.colors.statusSuccessBg,
          text: THEME.colors.statusSuccess,
          icon: 'checkmark-circle' as const,
        };
      case 'PENDING':
        return {
          label: 'Mencari Mitra',
          bg: THEME.colors.statusPendingBg,
          text: THEME.colors.statusPending,
          icon: 'time' as const,
        };
      case 'ACCEPTED':
      case 'IN_TRANSIT':
        return {
          label: 'Dalam Perjalanan',
          bg: THEME.colors.statusInProgressBg,
          text: THEME.colors.statusInProgress,
          icon: 'bicycle' as const,
        };
      case 'IN_PROGRESS':
        return {
          label: 'Sedang Dilayani',
          bg: THEME.colors.statusInProgressBg,
          text: THEME.colors.statusInProgress,
          icon: 'cut' as const,
        };
      case 'CANCELLED':
        return {
          label: 'Dibatalkan',
          bg: THEME.colors.statusCancelledBg,
          text: THEME.colors.statusCancelled,
          icon: 'close-circle' as const,
        };
      default:
        return {
          label: status,
          bg: THEME.colors.surfaceSubtle,
          text: THEME.colors.textMuted,
          icon: 'help-circle' as const,
        };
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const badge = getStatusBadgeConfig(item.status);

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.serviceNameRow}>
            <View style={styles.cutIconWrap}>
              <Ionicons name="cut" size={14} color={THEME.colors.primary} />
            </View>
            <Text style={styles.serviceTitle}>
              {item.service_type || 'Layanan Grooming'}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon} size={12} color={badge.text} />
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        {/* Location Info */}
        {item.user_location?.address && (
          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={14}
              color={THEME.colors.secondary}
            />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.user_location.address}
            </Text>
          </View>
        )}

        {/* Notes & Barber Assignment */}
        {item.notes && (
          <View style={styles.notesRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color="#64748B" />
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}

        {/* Order Details & Price */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.dateText}>
              {new Date(item.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.bookingId}>Order #{item.id.substring(0, 8)}</Text>
          </View>

          <Text style={styles.priceText}>
            Rp {item.total_price.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Aktivitas Pesanan</Text>
          <Text style={styles.headerSubtitle}>
            Pantau status kedatangan mitra dan riwayat layanan
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => refetch()}
          style={styles.refreshIconBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="reload" size={18} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {[
          { key: 'ALL' as FilterTab, label: 'Semua' },
          { key: 'ACTIVE' as FilterTab, label: 'Berlangsung' },
          { key: 'COMPLETED' as FilterTab, label: 'Selesai' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.tabItemText, isActive && styles.tabItemTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.colors.secondary} />
          <Text style={styles.loadingText}>Memuat daftar pesanan...</Text>
        </View>
      ) : isError || filteredBookings.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => { refetch(); }}
              tintColor={THEME.colors.secondary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="receipt-outline"
                  size={36}
                  color={THEME.colors.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Aktivitas</Text>
              <Text style={styles.emptySubtitle}>
                Pesanan yang Anda buat akan muncul di sini secara real-time.
              </Text>
              <TouchableOpacity
                style={styles.bookNowCta}
                onPress={() => router.push('/(tabs)/home')}
                activeOpacity={0.8}
              >
                <Text style={styles.bookNowCtaText}>Panggil Barber Sekarang</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => { refetch(); }}
              tintColor={THEME.colors.secondary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  refreshIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tabItemActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  tabItemTextActive: {
    color: THEME.colors.textInverse,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 110,
    gap: THEME.spacing.md,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    ...THEME.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    flex: 1,
  },
  cutIconWrap: {
    width: 26,
    height: 26,
    borderRadius: THEME.borderRadius.xs,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: THEME.spacing.md,
  },
  addressText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    flex: 1,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: THEME.spacing.sm,
  },
  notesText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderSubtle,
    paddingTop: THEME.spacing.sm,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  bookingId: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.secondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xxl,
  },
  loadingText: {
    marginTop: THEME.spacing.md,
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: THEME.spacing.xl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: THEME.spacing.xl,
  },
  bookNowCta: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.lg,
  },
  bookNowCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textInverse,
  },
});