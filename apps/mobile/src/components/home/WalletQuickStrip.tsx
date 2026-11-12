import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

interface WalletQuickStripProps {
  balance?: number;
  points?: number;
  voucherCount?: number;
  onPressTopUp?: () => void;
  onPressRewards?: () => void;
  onPressVouchers?: () => void;
}

export const WalletQuickStrip: React.FC<WalletQuickStripProps> = ({
  balance = 245000,
  points = 1420,
  voucherCount = 3,
  onPressTopUp,
  onPressRewards,
  onPressVouchers,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Col 1: HometikPay */}
        <View style={styles.col}>
          <View style={[styles.iconBox, styles.walletIconBox]}>
            <MaterialIcons name="account-balance-wallet" size={18} color="#00B14F" />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>HometikPay</Text>
            <Text style={styles.value} numberOfLines={1}>
              Rp {balance.toLocaleString('id-ID')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.plusBtn}
            onPress={onPressTopUp}
            activeOpacity={0.7}
            accessibilityLabel="Top up HometikPay"
          >
            <Ionicons name="add" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Col 2: Rewards (Original Amber Gold) */}
        <TouchableOpacity
          style={styles.col}
          onPress={onPressRewards}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, styles.rewardsIconBox]}>
            <MaterialIcons name="stars" size={18} color="#F59E0B" />
          </View>
          <View style={styles.infoCol}>
            <View style={styles.rewardsLabelRow}>
              <Text style={styles.label}>Rewards</Text>
              <View style={styles.vipBadge}>
                <Text style={styles.vipText}>VIP</Text>
              </View>
            </View>
            <Text style={styles.value} numberOfLines={1}>
              {points.toLocaleString('id-ID')} Poin
            </Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Col 3: Voucher (Original Teal/Blue) */}
        <TouchableOpacity
          style={[styles.col, styles.colRight]}
          onPress={onPressVouchers}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, styles.voucherIconBox]}>
            <MaterialIcons name="confirmation-number" size={18} color="#0284C7" />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Voucher</Text>
            <Text style={[styles.value, styles.voucherValue]} numberOfLines={1}>
              {voucherCount} Kupon
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  col: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colRight: {
    flex: 0.9,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIconBox: {
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  rewardsIconBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  voucherIconBox: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoCol: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  rewardsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  vipBadge: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  vipText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FBBF24',
  },
  value: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  voucherValue: {
    color: '#0284C7',
  },
  plusBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
