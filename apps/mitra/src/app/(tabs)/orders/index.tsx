import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMitraOrders, type MitraBooking } from '@/hooks/use-mitra-orders';
import { MITRA_THEME } from '@/constants/theme';

type FilterTab = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const formatCurrency = (amount: number) =>
  `Rp ${Math.round(amount).toLocaleString('id-ID')}`;

export default function MitraOrdersScreen() {
  const [filter, setFilter] = useState<FilterTab>('ACTIVE');
  const { allOrders, completedOrders, cancelledOrders, isRefetching, refetch } = useMitraOrders();

  const activeOrders = allOrders.filter((b) =>
    ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'IN_PROGRESS'].includes(b.status)
  );

  const displayedData =
    filter === 'ACTIVE'
      ? activeOrders
      : filter === 'COMPLETED'
      ? completedOrders
      : cancelledOrders;

  const renderItem = ({ item }: { item: MitraBooking }) => {
    const isSuccess = item.status === 'COMPLETED';
    const isCancelled = item.status === 'CANCELLED';

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.service}>{item.service_type}</Text>
          <Text style={styles.price}>{formatCurrency(Number(item.total_price))}</Text>
        </View>

        <Text style={styles.customer}>Klien: {item.user?.name || 'Pelanggan HomeTik'}</Text>
        <Text style={styles.address} numberOfLines={2}>
          📍 {item.user_location?.address || 'Koordinat GPS Pelanggan'}
        </Text>

        <View style={styles.footerRow}>
          <View
            style={[
              styles.statusChip,
              isSuccess
                ? styles.statusSuccess
                : isCancelled
                ? styles.statusCancelled
                : styles.statusActive,
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                isSuccess
                  ? styles.statusSuccessText
                  : isCancelled
                  ? styles.statusCancelledText
                  : styles.statusActiveText,
              ]}
            >
              {item.status}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={styles.headerDot} />
          <Text style={styles.headerTitle}>Riwayat &amp; Pesanan</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {(
          [
            { key: 'ACTIVE', label: `Aktif (${activeOrders.length})` },
            { key: 'COMPLETED', label: `Selesai (${completedOrders.length})` },
            { key: 'CANCELLED', label: `Batal (${cancelledOrders.length})` },
          ] as const
        ).map((tab) => {
          const isActive = filter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setFilter(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={displayedData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={MITRA_THEME.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="clipboard-outline" size={32} color={MITRA_THEME.colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Pesanan</Text>
            <Text style={styles.emptyText}>Pesanan pada tab ini akan otomatis muncul di sini.</Text>
          </View>
        }
      />
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
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: MITRA_THEME.colors.border,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: MITRA_THEME.colors.primary,
    borderColor: MITRA_THEME.colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: MITRA_THEME.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    gap: 12,
  },
  card: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    ...MITRA_THEME.shadows.card,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  service: {
    fontSize: 15,
    fontWeight: '800',
    color: MITRA_THEME.colors.textPrimary,
    flex: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: MITRA_THEME.colors.primary,
  },
  customer: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
    marginTop: 4,
  },
  address: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: MITRA_THEME.colors.borderSubtle,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: MITRA_THEME.colors.primaryLight,
  },
  statusActiveText: {
    color: MITRA_THEME.colors.primary,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
  },
  statusSuccessText: {
    color: '#047857',
  },
  statusCancelled: {
    backgroundColor: MITRA_THEME.colors.errorContainer,
  },
  statusCancelledText: {
    color: MITRA_THEME.colors.error,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11,
    color: MITRA_THEME.colors.textMuted,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  emptyText: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
    textAlign: 'center',
  },
});
