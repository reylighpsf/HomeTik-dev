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
import { useCreateBooking } from '@/hooks/use-bookings';
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
  SafeShieldBanner,
} from '@/components/home';

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { mutate: createBooking, isPending } = useCreateBooking();

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
    serviceName: string = 'Barber Kilat (Grab-Style Express)',
    price: number = 85000
  ) => {
    const confirmMessage =
      'Konfirmasi panggilan barber kilat ke lokasi: Jl. Pemuda No. 45, Surabaya (Estimasi tiba: 10-12 mnt)?';

    const triggerAction = () => {
      createBooking(
        {
          service_type: serviceName,
          notes: 'Panggilan instan express ke rumah via Hometik Grab-Style',
          total_price: price,
          scheduled_at: new Date().toISOString(),
          user_location: {
            latitude: -7.2656,
            longitude: 112.7483,
            address: 'Jl. Pemuda No. 45, Surabaya',
          },
        },
        {
          onSuccess: (data) => {
            const successMsg = `Pesanan panggilan #${data.id.substring(
              0,
              8
            )} berhasil dibuat! Mitra barber terdekat sedang menuju lokasi Anda.`;
            if (Platform.OS === 'web') {
              window.alert(successMsg);
            } else {
              Alert.alert('Barber On The Way! 🚀', successMsg);
            }
          },
          onError: (err: any) => {
            const errorMsg =
              err?.message || 'Gagal memanggil barber. Silakan coba sesaat lagi.';
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
      Alert.alert('Barber Kilat ⚡', confirmMessage, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Panggil Sekarang', onPress: triggerAction },
      ]);
    }
  };

  const handleBookBarber = (barber: BarberItem) => {
    handleInstantDispatch(`Panggilan ${barber.name} (${barber.specialty})`, barber.price);
  };

  const handleSelectService = (serviceId: string) => {
    if (serviceId === 'barber-kilat') {
      handleInstantDispatch();
    } else {
      router.push('/(tabs)/services');
    }
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
          isLoading={isPending}
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

        {/* 8. SafeShield Hygiene Protocol Banner */}
        <SafeShieldBanner />
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
