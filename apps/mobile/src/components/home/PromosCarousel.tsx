import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

export interface PromoItem {
  id: string;
  badge: string;
  badgeExtra: string;
  title: string;
  subtitle: string;
  footerCode: string;
}

export const PROMO_LIST: PromoItem[] = [
  {
    id: 'promo-1',
    badge: 'DISCOUNT 30%',
    badgeExtra: 'S/d 31 Des',
    title: 'Diskon 30% Potong Pertama',
    subtitle: 'Gunakan kode kupon saat checkout panggil barber instan.',
    footerCode: 'KODE: HOMETIK30',
  },
  {
    id: 'promo-2',
    badge: 'PAKET COMBO',
    badgeExtra: 'Terlaris',
    title: 'Paket Grooming Ayah & Anak',
    subtitle: 'Hemat Rp 35rb untuk 2 styling dalam satu kedatangan.',
    footerCode: 'HEMAT RP 35.000',
  },
];

interface PromosCarouselProps {
  onPressPromo?: (promo: PromoItem) => void;
  onPressViewAll?: () => void;
}

export const PromosCarousel: React.FC<PromosCarouselProps> = ({
  onPressPromo,
  onPressViewAll,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Spesial Untukmu</Text>
          <MaterialIcons name="local-offer" size={17} color="#00B14F" />
        </View>
        {onPressViewAll && (
          <TouchableOpacity onPress={onPressViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PROMO_LIST.map((promo) => {
          return (
            <TouchableOpacity
              key={promo.id}
              style={styles.promoCard}
              onPress={() => onPressPromo?.(promo)}
              activeOpacity={0.85}
            >
              <View style={styles.topRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{promo.badge}</Text>
                </View>
                <Text style={styles.badgeExtra}>{promo.badgeExtra}</Text>
              </View>

              <Text style={styles.promoTitle}>{promo.title}</Text>
              <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>

              <View style={styles.footerRow}>
                <View style={styles.footerPill}>
                  <Text style={styles.footerPillText}>{promo.footerCode}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#00B14F" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B14F',
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    gap: 12,
  },
  promoCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: '#00873D',
  },
  badgeExtra: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    lineHeight: 19,
  },
  promoSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: '#475569',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerPill: {
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  footerPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: '#00873D',
  },
});
