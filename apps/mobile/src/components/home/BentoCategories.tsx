import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { ServiceCategory } from '@/constants/mock-data';

interface BentoCategoriesProps {
  categories: ServiceCategory[];
  selectedCategory: string | null;
  onSelectCategory: (id: string) => void;
  onPressViewAll?: () => void;
}

export const BentoCategories: React.FC<BentoCategoriesProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onPressViewAll,
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Service Categories</Text>
        {onPressViewAll && (
          <TouchableOpacity onPress={onPressViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>Explore All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bento Grid */}
      <View style={styles.gridContainer}>
        {/* Card 1: Barber & Grooming (Span 2) */}
        <TouchableOpacity
          style={styles.barberCard}
          onPress={() => onSelectCategory('barber')}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.barberIconWrap}>
              <MaterialIcons name="content-cut" size={24} color={THEME.colors.primary} />
            </View>
            <View style={styles.barbersNearbyBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.barbersNearbyText}>14 Barbers nearby</Text>
            </View>
          </View>

          <View style={styles.barberTitleRow}>
            <Text style={styles.barberTitle}>Barber & Grooming</Text>
            <View style={styles.popularBadge}>
              <Ionicons name="flame" size={12} color={THEME.colors.secondary} />
              <Text style={styles.popularBadgeText}>Most Popular</Text>
            </View>
          </View>

          <Text style={styles.barberDescription}>
            Master haircuts, precision beard sculpt, hot towel shaves & scalp treatments.
          </Text>

          <View style={styles.barberFooterRow}>
            <Text style={styles.barberPriceText}>Starts from Rp 75.000</Text>
            <View style={styles.bookActionRow}>
              <Text style={styles.bookActionText}>Book Service</Text>
              <Ionicons name="chevron-forward" size={14} color={THEME.colors.primary} />
            </View>
          </View>
        </TouchableOpacity>

        {/* 2-Column Row for Spa and Cleaning */}
        <View style={styles.twoColRow}>
          {/* Card 2: Beauty & Spa */}
          <TouchableOpacity
            style={styles.spaCard}
            onPress={() => onSelectCategory('spa')}
            activeOpacity={0.85}
          >
            <View style={styles.smallCardHeader}>
              <View style={styles.spaIconWrap}>
                <MaterialIcons name="spa" size={20} color={THEME.colors.secondary} />
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255, 185, 95, 0.6)" />
            </View>
            <Text style={styles.smallCardTitle}>Beauty & Spa</Text>
            <Text style={styles.smallCardDescription} numberOfLines={2}>
              Facial therapy, reflexology, manicures & deep stress release.
            </Text>
          </TouchableOpacity>

          {/* Card 3: Home Cleaning */}
          <TouchableOpacity
            style={styles.cleaningCard}
            onPress={() => onSelectCategory('cleaning')}
            activeOpacity={0.85}
          >
            <View style={styles.smallCardHeader}>
              <View style={styles.cleaningIconWrap}>
                <MaterialIcons name="cleaning-services" size={20} color="#2DD4BF" />
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(45, 212, 191, 0.6)" />
            </View>
            <Text style={styles.smallCardTitle}>Home Cleaning</Text>
            <Text style={styles.smallCardDescription} numberOfLines={2}>
              Hydro-vacuum dust mites, room deep sanitization & kitchen shine.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card 4: AC & Appliance Care (Span 2 Horizontal) */}
        <TouchableOpacity
          style={styles.applianceCard}
          onPress={() => onSelectCategory('appliance')}
          activeOpacity={0.85}
        >
          <View style={styles.applianceLeftWrap}>
            <View style={styles.applianceIconWrap}>
              <MaterialIcons name="build" size={20} color="#FB923C" />
            </View>
            <View style={styles.applianceTextWrap}>
              <Text style={styles.applianceTitle}>AC & Appliance Care</Text>
              <Text style={styles.applianceSub} numberOfLines={1}>
                Pressure coil cleaning, freon check & diagnostic
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(251, 146, 60, 0.6)" />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  gridContainer: {
    gap: 12,
  },
  barberCard: {
    backgroundColor: '#0D2319',
    borderRadius: THEME.borderRadius.xxl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  barberIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(78, 222, 163, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.35)',
  },
  barbersNearbyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
  },
  barbersNearbyText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  barberTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  barberTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 185, 95, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 95, 0.4)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    gap: 3,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.secondary,
  },
  barberDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#BBCABF',
    marginBottom: 14,
  },
  barberFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 22, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  barberPriceText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#BBCABF',
  },
  bookActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bookActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  spaCard: {
    flex: 1,
    backgroundColor: '#271B0B',
    borderRadius: THEME.borderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 95, 0.3)',
    justifyContent: 'space-between',
    minHeight: 130,
  },
  cleaningCard: {
    flex: 1,
    backgroundColor: '#0C2428',
    borderRadius: THEME.borderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    justifyContent: 'space-between',
    minHeight: 130,
  },
  smallCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  spaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 185, 95, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 95, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cleaningIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  smallCardDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: '#BBCABF',
  },
  applianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A1708',
    borderRadius: THEME.borderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  applianceLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  applianceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applianceTextWrap: {
    flex: 1,
  },
  applianceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  applianceSub: {
    fontSize: 11,
    color: '#BBCABF',
  },
});
