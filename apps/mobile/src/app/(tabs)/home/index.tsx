import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '@/hooks/use-profile';
import { THEME } from '@/constants/theme';
import { TOP_BARBERS, BarberItem } from '@/constants/mock-data';
import {
  HeaderSection,
  SearchBar,
  WalletQuickStrip,
  ServiceGrid8,
  ExpressDispatchCard,
  PromosCarousel,
  TopRatedBarbers,
} from '@/components/home';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter barbers by search query if typed
  const filteredBarbers = useMemo(() => {
    if (!searchQuery.trim()) return TOP_BARBERS;
    const q = searchQuery.toLowerCase();
    return TOP_BARBERS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.specialty.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const handleInstantDispatch = (
    serviceName: string = 'Barber Kilat On-Demand',
    price: number = 85000
  ) => {
    // Arahkan ke pemilihan barber yang sedang online di area sekitar
    router.push({
      pathname: '/booking/select-barber',
      params: {
        serviceId: 'srv-barber-kilat',
        serviceName,
        price: price.toString(),
      },
    });
  };

  const handleBookBarber = (barber: BarberItem) => {
    router.push({
      pathname: '/booking/select-barber',
      params: {
        serviceId: 'srv-barber-kilat',
        serviceName: `Panggilan Khusus: ${barber.name}`,
        price: barber.price.toString(),
      },
    });
  };

  const handleSelectService = (serviceId: string) => {
    if (serviceId === 'lainnya') {
      router.push('/(tabs)/services');
      return;
    }

    const serviceMap: Record<string, { name: string; price: number }> = {
      'barber-kilat': { name: 'Barber Kilat On-Demand', price: 85000 },
      'booking-barber': { name: 'Gentleman Royal Grooming', price: 135000 },
      'haircut-anak': { name: 'Haircut Ramah Anak (Kids)', price: 70000 },
      'shaving': { name: 'Premium Hot Towel Shave', price: 65000 },
      'spa': { name: 'Relaxing Head Spa & Massage', price: 110000 },
      'cleaning': { name: 'Home & Room Sanitizing', price: 125000 },
      'ac-repair': { name: 'AC Maintenance & Clean', price: 95000 },
    };

    const target = serviceMap[serviceId] || { name: 'Layanan Barber', price: 85000 };

    router.push({
      pathname: '/booking/select-barber',
      params: {
        serviceId,
        serviceName: target.name,
        price: target.price.toString(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.primary}
            colors={[THEME.colors.primary]}
          />
        }
      >
        {/* 1. Header Section: Address Delivery & Action Buttons */}
        <HeaderSection
          currentAddress="Jl. Pemuda No. 45, Surabaya"
          avatarUrl={profile?.avatar_url}
          onPressLocation={() => {
            Alert.alert('Pilih Alamat Antar', 'Pilih dari daftar alamat tersimpan atau tandai di peta.');
          }}
          onPressNotifications={() => {
            Alert.alert('Notifikasi', 'Tidak ada notifikasi baru.');
          }}
          onPressProfile={() => router.push('/(tabs)/profile')}
        />

        {/* 2. Integrated Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onPressFilter={() => {
            Alert.alert('Filter Layanan', 'Atur filter harga, jarak terdekat, dan rating tertinggi.');
          }}
        />

        {/* 3. Wallet & Rewards Quick Strip (HometikPay, Rewards VIP, Kupon) */}
        <WalletQuickStrip
          onPressTopUp={() => {
            Alert.alert('Top Up HometikPay', 'Metode top-up via BCA, Mandiri, QRIS, atau Kartu Debit.');
          }}
          onPressRewards={() => {
            Alert.alert('Hometik Rewards', 'Tukar 1.420 poin Anda dengan diskon potong rambut & styling gratis.');
          }}
          onPressVouchers={() => {
            Alert.alert('Voucher Kupon', '3 kupon aktif tersedia untuk pesanan hari ini.');
          }}
        />

        {/* 4. Grab-Style 8 Grid Services */}
        <ServiceGrid8 onSelectService={handleSelectService} />

        {/* 5. Grab-Style Express Instant Barber Dispatch Card */}
        <ExpressDispatchCard
          onPressDispatch={() => handleInstantDispatch()}
          isLoading={false}
        />

        {/* 6. Special Promo Carousel (Spesial Untukmu) */}
        <PromosCarousel
          onPressPromo={(promo) => {
            Alert.alert(promo.title, `Gunakan ${promo.footerCode} untuk mendapatkan potongan.`);
          }}
          onPressViewAll={() => router.push('/(tabs)/services')}
        />

        {/* 7. Top Rated Master Barbers Carousel */}
        <TopRatedBarbers
          barbers={filteredBarbers}
          onPressBookBarber={handleBookBarber}
          onPressViewAll={() => router.push('/(tabs)/services')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    paddingBottom: 110, // Space for floating bottom navigation bar
  },
});
