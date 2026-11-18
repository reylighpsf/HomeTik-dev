import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { THEME } from '@/constants/theme';

export interface ServiceItem {
  id: string;
  title: string;
  category: 'haircut' | 'kids' | 'spa' | 'cleaning' | 'home';
  price: number;
  durationMinutes: number;
  description: string;
  rating: number;
  reviewsCount: number;
  badge?: string;
  isPopular?: boolean;
}

export const PUBLIC_SERVICES_CATALOG: ServiceItem[] = [
  {
    id: 'srv-barber-kilat',
    title: 'Barber Kilat On-Demand',
    category: 'haircut',
    price: 85000,
    durationMinutes: 35,
    description: 'Panggilan barber instan ke rumah. Tiba dalam 12-15 menit dengan koper steril UV lengkap.',
    rating: 4.9,
    reviewsCount: 382,
    badge: 'KILAT TERLARIS',
    isPopular: true,
  },
  {
    id: 'srv-gentleman-grooming',
    title: 'Gentleman Royal Grooming',
    category: 'haircut',
    price: 135000,
    durationMinutes: 50,
    description: 'Potong rambut presisi, cuci rambut herbal, pijat relaksasi kepala & bahu, plus styling pomade.',
    rating: 4.95,
    reviewsCount: 247,
    badge: 'VIP CHOICE',
    isPopular: true,
  },
  {
    id: 'srv-haircut-anak',
    title: 'Haircut Ramah Anak (Kids)',
    category: 'kids',
    price: 70000,
    durationMinutes: 30,
    description: 'Stylist sabar berpengalaman menangani anak & balita. Dilengkapi cape kartun menyenangkan.',
    rating: 4.88,
    reviewsCount: 164,
    badge: 'FAMILY FAVORITE',
  },
  {
    id: 'srv-head-spa-creambath',
    title: 'Relaxing Head Spa & Tonic',
    category: 'spa',
    price: 110000,
    durationMinutes: 45,
    description: 'Perawatan anti-ketombe dan penutrisi akar rambut dengan steamer portabel & pijat akupresur.',
    rating: 4.85,
    reviewsCount: 92,
  },
  {
    id: 'srv-home-cleaning',
    title: 'Home & Room Sanitizing',
    category: 'cleaning',
    price: 125000,
    durationMinutes: 60,
    description: 'Pembersihan dan sterilisasi ruang hunian menggunakan disinfektan food-grade bebas bau.',
    rating: 4.8,
    reviewsCount: 79,
  },
  {
    id: 'srv-ac-service',
    title: 'AC Maintenance & Clean',
    category: 'home',
    price: 95000,
    durationMinutes: 45,
    description: 'Cuci filter AC split, pengecekan freon, dan pembersihan kisi-kisi indoor bertekanan tinggi.',
    rating: 4.82,
    reviewsCount: 115,
  },
];

interface PublicCatalogProps {
  onSelectService?: (service: ServiceItem) => void;
}

export const PublicCatalog: React.FC<PublicCatalogProps> = ({ onSelectService }) => {
  const router = useRouter();
  const { session, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredServices = useMemo(() => {
    return PUBLIC_SERVICES_CATALOG.filter((item) => {
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  /**
   * Logika Route Guarding:
   * Jika pengguna adalah Tamu (!session atau !isAuthenticated),
   * tampilkan Alert peringatan dan arahkan ke layar Login.
   */
  const handleBookService = (service: ServiceItem) => {
    // 1. Periksa apakah pengguna adalah Tamu (Unauthenticated)
    if (!session || !isAuthenticated) {
      const alertTitle = 'Login Diperlukan';
      const alertMessage =
        'Silakan Login atau Daftar terlebih dahulu untuk melanjutkan pemesanan layanan barber ke rumah Anda.';

      if (Platform.OS === 'web') {
        const confirmLogin = window.confirm(`${alertTitle}\n\n${alertMessage}\n\nLanjutkan ke halaman Login?`);
        if (confirmLogin) {
          router.push('/login');
        }
      } else {
        Alert.alert(alertTitle, alertMessage, [
          {
            text: 'Nanti Saja',
            style: 'cancel',
          },
          {
            text: 'Login Sekarang',
            style: 'default',
            onPress: () => {
              router.push('/login');
            },
          },
        ]);
      }
      return;
    }

    // 2. Jika sudah terotentikasi, jalankan proses booking
    if (onSelectService) {
      onSelectService(service);
    } else {
      router.push({
        pathname: '/booking/select-barber',
        params: {
          serviceId: service.id,
          serviceName: service.title,
          price: service.price.toString(),
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Tamu / Guest Mode Banner */}
      {(!session || !isAuthenticated) && (
        <View style={styles.guestBanner}>
          <View style={styles.guestBannerLeft}>
            <Ionicons name="information-circle" size={20} color="#00B14F" />
            <View style={styles.guestBannerTextWrap}>
              <Text style={styles.guestBannerTitle}>Mode Tamu (Guest)</Text>
              <Text style={styles.guestBannerSubtitle}>
                Anda dapat menjelajah katalog layanan kami. Masuk untuk melakukan pemesanan instan.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.guestLoginPill}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.guestLoginPillText}>Masuk</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari layanan cukur, spa, anak..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Pills */}
      <View style={styles.categoryWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {[
            { id: 'all', label: 'Semua Layanan' },
            { id: 'haircut', label: 'Potong Rambut' },
            { id: 'kids', label: 'Anak-Anak' },
            { id: 'spa', label: 'Head Spa' },
            { id: 'cleaning', label: 'Sanitasi' },
            { id: 'home', label: 'Perawatan Rumah' },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Services List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.servicesScroll}
      >
        <Text style={styles.sectionTitle}>
          Pilihan Layanan ({filteredServices.length})
        </Text>

        {filteredServices.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            {/* Top row: Title & Badge */}
            <View style={styles.cardHeader}>
              <View style={styles.titleArea}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                {service.badge && (
                  <View style={styles.badgeWrap}>
                    <Text style={styles.badgeText}>{service.badge}</Text>
                  </View>
                )}
              </View>

              <View style={styles.ratingWrap}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.serviceDesc}>{service.description}</Text>

            {/* Meta info: Duration & hygiene */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text style={styles.metaText}>{service.durationMinutes} menit</Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.metaItem}>
                <MaterialIcons name="health-and-safety" size={14} color="#00B14F" />
                <Text style={styles.metaSafeText}>Koper UV Steril</Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{service.reviewsCount}+ ulasan</Text>
            </View>

            {/* Price & Book Button */}
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.priceLabel}>Biaya Layanan</Text>
                <Text style={styles.priceValue}>
                  Rp {service.price.toLocaleString('id-ID')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleBookService(service)}
                activeOpacity={0.85}
              >
                <Text style={styles.bookButtonText}>Pesan Sekarang</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.footerSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  guestBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  guestBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingRight: 8,
  },
  guestBannerTextWrap: {
    flex: 1,
  },
  guestBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  guestBannerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  guestLoginPill: {
    backgroundColor: '#00B14F',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  guestLoginPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  categoryWrap: {
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  servicesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleArea: {
    flex: 1,
    paddingRight: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00873D',
    letterSpacing: 0.3,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  serviceDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  metaSafeText: {
    fontSize: 11,
    color: '#00873D',
    fontWeight: '700',
  },
  metaDot: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00B14F',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  footerSpacing: {
    height: 16,
  },
});
