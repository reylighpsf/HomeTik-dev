import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { ASSETS } from '@/constants/assets';

interface HeroPromoCardProps {
  onPressBook: () => void;
  discountBadge?: string;
  title?: string;
  subtitle?: string;
}

export const HeroPromoCard: React.FC<HeroPromoCardProps> = ({
  onPressBook,
  discountBadge = '30% OFF FIRST VISIT',
  title = 'VIP Grooming at Your Doorstep',
  subtitle = 'Certified master barbers arrive in ~20 mins equipped with sealed UV-sterilized kits & custom styling gear.',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Ambient Glows */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowBottom} />

        {/* Top Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.discountBadge}>
            <View style={styles.discountDot} />
            <Text style={styles.discountText}>{discountBadge}</Text>
          </View>

          <View style={styles.verifiedBtn}>
            <Ionicons name="shield-checkmark" size={16} color={THEME.colors.secondary} />
          </View>
        </View>

        {/* Title & Copy */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>

        {/* Footer: Barber Avatars Stack & Action Button */}
        <View style={styles.footerRow}>
          <View style={styles.avatarStack}>
            <Image source={{ uri: ASSETS.heroBarber1 }} style={[styles.barberAvatar, styles.avatar1]} />
            <Image source={{ uri: ASSETS.heroBarber2 }} style={[styles.barberAvatar, styles.avatar2]} />
            <Text style={styles.vettedText}>Top 1% vetted pros</Text>
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={onPressBook}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={15} color="#003824" />
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#0A1E16',
    borderRadius: THEME.borderRadius.xxl,
    padding: THEME.spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(78, 222, 163, 0.22)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 185, 95, 0.15)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.4)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 6,
  },
  discountDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6FFBBE',
    letterSpacing: 0.6,
  },
  verifiedBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(38, 42, 51, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 95, 0.3)',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: '#BBCABF',
    marginBottom: THEME.spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(78, 222, 163, 0.8)',
  },
  avatar1: {
    zIndex: 2,
  },
  avatar2: {
    marginLeft: -8,
    zIndex: 1,
  },
  vettedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#BBCABF',
    marginLeft: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 999,
    gap: 6,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003824',
    letterSpacing: 0.3,
  },
});
