import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMitraOrders } from '@/hooks/use-mitra-orders';
import { MITRA_THEME } from '@/constants/theme';

const formatCurrency = (amount: number) =>
  `Rp ${Math.round(amount).toLocaleString('id-ID')}`;

export default function MitraWalletScreen() {
  const { completedOrders, totalGrossRevenue, netPartnerEarnings, todayEarnings } =
    useMitraOrders();
  const [isRequesting, setIsRequesting] = useState(false);

  const platformFee = totalGrossRevenue - netPartnerEarnings;

  const handleWithdraw = () => {
    if (netPartnerEarnings < 50000) {
      const msg = 'Minimal penarikan saldo Mitra adalah Rp 50.000.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Saldo Belum Mencukupi', msg);
      return;
    }

    setIsRequesting(true);
    setTimeout(() => {
      setIsRequesting(false);
      const msg = `Permintaan pencairan dana sebesar ${formatCurrency(
        netPartnerEarnings
      )} telah dicatat untuk diproses admin HomeTik.`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Pengajuan Penarikan Terkirim 💸', msg);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={styles.headerDot} />
          <Text style={styles.headerTitle}>Dompet &amp; Saldo</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card in Stitch Deep Emerald */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Saldo Siap Tarik (Bagi Hasil 85%)</Text>
          <Text style={styles.walletBalance}>{formatCurrency(netPartnerEarnings)}</Text>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Hari Ini</Text>
              <Text style={styles.breakdownVal}>{formatCurrency(todayEarnings)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Total Bruto</Text>
              <Text style={styles.breakdownVal}>{formatCurrency(totalGrossRevenue)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Komisi 15%</Text>
              <Text style={styles.breakdownVal}>{formatCurrency(platformFee)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.withdrawBtn}
            onPress={handleWithdraw}
            disabled={isRequesting}
          >
            <Ionicons name="cash-outline" size={18} color={MITRA_THEME.colors.primary} />
            <Text style={styles.withdrawBtnText}>
              {isRequesting ? 'Memproses...' : 'Tarik Saldo ke Rekening'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions Section */}
        <Text style={styles.sectionTitle}>
          Riwayat Pendapatan Masuk ({completedOrders.length})
        </Text>

        {completedOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="wallet-outline" size={32} color={MITRA_THEME.colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>
              Belum ada transaksi selesai. Saldo bagi hasil 85% akan otomatis masuk ke sini setelah Anda menyelesaikan order.
            </Text>
          </View>
        ) : (
          completedOrders.map((order) => (
            <View key={order.id} style={styles.txCard}>
              <View style={styles.txIcon}>
                <Ionicons name="arrow-down-circle" size={22} color={MITRA_THEME.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txTitle}>{order.service_type}</Text>
                <Text style={styles.txSub}>
                  {order.user?.name || 'Pelanggan'} •{' '}
                  {new Date(order.completed_at || order.updated_at).toLocaleDateString('id-ID')}
                </Text>
              </View>
              <Text style={styles.txAmount}>
                +{formatCurrency(Math.round(Number(order.total_price) * 0.85))}
              </Text>
            </View>
          ))
        )}
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
    paddingBottom: 32,
  },
  walletCard: {
    backgroundColor: MITRA_THEME.colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...MITRA_THEME.shadows.card,
  },
  walletLabel: {
    fontSize: 12,
    color: MITRA_THEME.colors.primaryFixedDim,
    fontWeight: '600',
  },
  walletBalance: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 3,
  },
  withdrawBtn: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  withdrawBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: MITRA_THEME.colors.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    ...MITRA_THEME.shadows.card,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: MITRA_THEME.colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...MITRA_THEME.shadows.card,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: MITRA_THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: MITRA_THEME.colors.textPrimary,
  },
  txSub: {
    fontSize: 12,
    color: MITRA_THEME.colors.textSecondary,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: MITRA_THEME.colors.primary,
  },
});
