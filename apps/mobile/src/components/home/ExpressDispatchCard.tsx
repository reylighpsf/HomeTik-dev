import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { ASSETS } from '@/constants/assets';

interface ExpressDispatchCardProps {
  onPressDispatch: () => void;
  isLoading?: boolean;
  etaMinutes?: number;
  barbersAvailable?: number;
  startingPrice?: number;
}

export const ExpressDispatchCard: React.FC<ExpressDispatchCardProps> = ({
  onPressDispatch,
  isLoading = false,
  etaMinutes = 12,
  barbersAvailable = 14,
  startingPrice = 85000,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Top Badges Row */}
        <View style={styles.topRow}>
          <View style={styles.leftTags}>
            <View style={styles.expressTag}>
              <Text style={styles.expressTagText}>EXPRESS ON-DEMAND</Text>
            </View>
            <View style={styles.etaTag}>
              <Ionicons name="flash" size={12} color="#00B14F" />
              <Text style={styles.etaText}>ETA {etaMinutes} Mnt</Text>
            </View>
          </View>

          <View style={styles.standbyTag}>
            <View style={styles.pulseDot} />
            <Text style={styles.standbyText}>{barbersAvailable} Siaga</Text>
          </View>
        </View>

        {/* Title, Description & Barber Avatars */}
        <View style={styles.middleRow}>
          <View style={styles.textWrap}>
            <Text style={styles.title}>Panggil Barber Instan</Text>
            <Text style={styles.subtitle}>
              Mitra terdekat langsung meluncur ke rumah Anda dengan koper steril UV lengkap.
            </Text>
          </View>

          {/* Barber Avatars Stack */}
          <View style={styles.avatarStack}>
            <Image
              source={{ uri: ASSETS.heroBarber1 }}
              style={[styles.avatar, styles.avatar1]}
            />
            <Image
              source={{ uri: ASSETS.heroBarber2 }}
              style={[styles.avatar, styles.avatar2]}
            />
          </View>
        </View>

        {/* Full-Width Dispatch CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled]}
          onPress={onPressDispatch}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          <View style={styles.ctaLeft}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="navigate" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.ctaText}>
              {isLoading ? 'Menghubungkan...' : 'Panggil Sekarang'}
            </Text>
          </View>

          <View style={styles.ctaRightPill}>
            <Text style={styles.ctaPriceText}>
              Mulai Rp {(startingPrice / 1000).toFixed(0)}rb
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#00873D" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xxl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#00B14F',
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expressTag: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  expressTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00873D',
    letterSpacing: 0.4,
  },
  etaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    gap: 3,
  },
  etaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00873D',
  },
  standbyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00B14F',
  },
  standbyText: {
    fontSize: 11,
    color: '#00873D',
    fontWeight: '700',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
  avatarStack: {
    flexDirection: 'row',
    paddingTop: 2,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#00B14F',
  },
  avatar1: {
    zIndex: 2,
  },
  avatar2: {
    marginLeft: -10,
    zIndex: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#00B14F',
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaRightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  ctaPriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00873D',
  },
});
