import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { BarberItem } from '@/constants/mock-data';

interface TopRatedBarbersProps {
  barbers: BarberItem[];
  onPressBookBarber: (barber: BarberItem) => void;
  onPressViewAll?: () => void;
}

export const TopRatedBarbers: React.FC<TopRatedBarbersProps> = ({
  barbers,
  onPressBookBarber,
  onPressViewAll,
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Top Master Barbers Terdekat</Text>
          <Text style={styles.subtitle}>Siap dipanggil ke lokasi Jl. Pemuda</Text>
        </View>
        {onPressViewAll && (
          <TouchableOpacity onPress={onPressViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {barbers.map((barber) => {
          return (
            <View key={barber.id} style={styles.card}>
              {/* Image Container with Badges */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: barber.avatarUrl }} style={styles.image} resizeMode="cover" />

                {/* Top Badge (Black & White Combination) */}
                {barber.badge && (
                  <View style={styles.topBadge}>
                    <Text style={styles.topBadgeText}>
                      {barber.badge}
                    </Text>
                  </View>
                )}

                {/* Rating Badge (Original Gold Star) */}
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.ratingText}>{barber.rating.toFixed(1)}</Text>
                </View>
              </View>

              {/* Info Details */}
              <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.barberName} numberOfLines={1}>
                    {barber.name}
                  </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#00B14F"
                  />
                </View>
                <Text style={styles.specialtyText} numberOfLines={1}>
                  {barber.specialty}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.distanceWrap}>
                    <Ionicons name="navigate-outline" size={12} color="#00B14F" />
                    <Text style={styles.distanceText}>
                      {barber.distanceKm} km ({barber.etaMinutes || 8}m)
                    </Text>
                  </View>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.cutsText}>{barber.cutsDone || barber.reviewsCount} cuts</Text>
                </View>
              </View>

              {/* Price & Panggil Button */}
              <View style={styles.bottomRow}>
                <View>
                  <Text style={styles.priceLabel}>Mulai</Text>
                  <Text style={styles.priceValue}>
                    Rp {barber.price.toLocaleString('id-ID')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => onPressBookBarber(barber)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bookButtonText}>Panggil</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B14F',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    gap: 12,
  },
  card: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 128,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.4,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoContainer: {
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  barberName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  specialtyText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B14F',
  },
  dotSeparator: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  cutsText: {
    fontSize: 11,
    color: '#64748B',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookButton: {
    backgroundColor: '#00B14F',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
