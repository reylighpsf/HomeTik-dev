import React, { useState, useMemo } from 'react';
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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCreateBooking } from '@/hooks/use-bookings';
import { THEME } from '@/constants/theme';
import { SERVICE_CATALOG, CATEGORIES, ServiceItem } from '@/constants/mock-data';

export default function ServicesScreen() {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const { mutate: createBooking, isPending } = useCreateBooking();

  const filterTabs = useMemo(() => {
    return [
      { id: 'all', title: 'Semua Layanan' },
      ...CATEGORIES.map((c) => ({ id: c.id, title: c.title })),
    ];
  }, []);

  const filteredServices = useMemo(() => {
    if (activeCategoryId === 'all') return SERVICE_CATALOG;
    return SERVICE_CATALOG.filter((s) => s.categoryId === activeCategoryId);
  }, [activeCategoryId]);

  const handleBookService = (service: ServiceItem) => {
    const confirmMessage = `Pesan layanan "${service.name}" seharga Rp ${service.price.toLocaleString(
      'id-ID'
    )} ke alamat Anda?`;

    const triggerAction = () => {
      createBooking(
        {
          service_type: service.name,
          notes: `Layanan ${service.name} (${service.durationMinutes} mnt)`,
          total_price: service.price,
          scheduled_at: new Date().toISOString(),
          user_location: {
            latitude: -7.2656,
            longitude: 112.7483,
            address: 'Jl. Pemuda No. 45, Surabaya',
          },
        },
        {
          onSuccess: (data) => {
            const successMsg = `Pesanan #${data.id.substring(
              0,
              8
            )} berhasil dibuat! Mitra akan segera dikonfirmasi.`;
            if (Platform.OS === 'web') {
              window.alert(successMsg);
            } else {
              Alert.alert('Pesanan Diterima! 🎉', successMsg);
            }
            router.push('/(tabs)/bookings');
          },
          onError: (err: any) => {
            const errorMsg =
              err?.message || 'Gagal membuat pesanan. Silakan coba kembali.';
            if (Platform.OS === 'web') {
              window.alert(`Error: ${errorMsg}`);
            } else {
              Alert.alert('Gagal Memesan', errorMsg);
            }
          },
        }
      );
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        triggerAction();
      }
    } else {
      Alert.alert('Konfirmasi Pesanan', confirmMessage, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Konfirmasi', onPress: triggerAction },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Katalog Layanan</Text>
        <Text style={styles.headerSubtitle}>
          Pilih paket grooming & perawatan profesional langsung ke rumah
        </Text>
      </View>

      {/* Category Filter Horizontal Scroll */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {filterTabs.map((tab) => {
            const isActive = activeCategoryId === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveCategoryId(tab.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isActive && styles.tabButtonTextActive,
                  ]}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Services List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.listContainer}>
          {filteredServices.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.durationBadge}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={THEME.colors.secondary}
                    />
                    <Text style={styles.durationText}>
                      {service.durationMinutes} Menit
                    </Text>
                  </View>
                </View>

                {service.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
              </View>

              <Text style={styles.serviceDesc}>{service.description}</Text>

              {/* Feature Checklist */}
              {service.features && (
                <View style={styles.featureList}>
                  {service.features.map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={THEME.colors.secondary}
                      />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Price & Book Row */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.priceLabel}>Biaya Layanan</Text>
                  <Text style={styles.priceText}>
                    Rp {service.price.toLocaleString('id-ID')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => handleBookService(service)}
                  disabled={isPending}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bookButtonText}>Pesan Sekarang</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={THEME.colors.textInverse}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
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
  tabContainer: {
    paddingVertical: THEME.spacing.md,
  },
  tabScrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tabButtonActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: THEME.colors.textInverse,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 110,
  },
  listContainer: {
    gap: THEME.spacing.md,
  },
  serviceCard: {
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
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  cardTitleWrap: {
    flex: 1,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.secondary,
  },
  popularBadge: {
    backgroundColor: 'rgba(111, 251, 190, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.xs,
    borderWidth: 1,
    borderColor: THEME.colors.secondaryContainer,
  },
  popularText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.secondary,
    letterSpacing: 0.5,
  },
  serviceDesc: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 19,
    marginBottom: THEME.spacing.md,
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.surfaceSubtle,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderSubtle,
    paddingTop: THEME.spacing.md,
  },
  priceLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.lg,
    gap: 6,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textInverse,
  },
});