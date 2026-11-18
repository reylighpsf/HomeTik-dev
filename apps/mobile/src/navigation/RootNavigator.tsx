import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { SplashLoadingScreen } from '@/components/splash';

// Auth Screen Components (Guest Stack)
import LoginScreen from '@/app/login';
import RegisterScreen from '@/app/register';
import ForgotPasswordScreen from '@/app/forgot-password';
import { PublicCatalog } from '@/features/services/PublicCatalog';

// Logged-in Screen Components (App Stack)
import HomeScreen from '@/app/(tabs)/home';
import BookingsScreen from '@/app/(tabs)/bookings';
import ServicesScreen from '@/app/(tabs)/services';
import ProfileScreen from '@/app/(tabs)/profile';

export type AuthScreenName = 'login' | 'register' | 'forgot-password' | 'public-catalog';
export type AppTabName = 'home' | 'bookings' | 'services' | 'profile';

/**
 * AuthStack (Guest Mode):
 * Ditampilkan saat isAuthenticated === false
 * Menyediakan akses ke Login, Register, Forgot Password, dan Public Catalog
 */
export const AuthStack: React.FC<{ initialRoute?: AuthScreenName }> = ({
  initialRoute = 'public-catalog',
}) => {
  const [currentScreen, setCurrentScreen] = React.useState<AuthScreenName>(initialRoute);

  return (
    <View style={styles.container}>
      {currentScreen === 'public-catalog' && (
        <PublicCatalog />
      )}
      {currentScreen === 'login' && (
        <LoginScreen />
      )}
      {currentScreen === 'register' && (
        <RegisterScreen />
      )}
      {currentScreen === 'forgot-password' && (
        <ForgotPasswordScreen />
      )}
    </View>
  );
};

/**
 * AppStack (Logged-In Mode):
 * Ditampilkan saat isAuthenticated === true
 * Menyediakan akses penuh ke Home Dashboard, Booking Flow, Riwayat, dan Profile
 */
export const AppStack: React.FC<{ initialTab?: AppTabName }> = ({
  initialTab = 'home',
}) => {
  const [activeTab, setActiveTab] = React.useState<AppTabName>(initialTab);

  return (
    <View style={styles.container}>
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'bookings' && <BookingsScreen />}
      {activeTab === 'services' && <ServicesScreen />}
      {activeTab === 'profile' && <ProfileScreen />}
    </View>
  );
};

/**
 * RootNavigator
 * Komponen Arsitektur Utama: Menghubungkan Global Auth State dengan Navigation Stacks
 * Menggunakan ekspresi Ternary Operator untuk memisahkan Guest Mode dan Logged-in Mode
 */
export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // 1. Tampilkan splash loading saat memeriksa kredensial / session JWT
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SplashLoadingScreen onFinish={() => {}} />
      </View>
    );
  }

  // 2. Evaluasi Ternary Operator sesuai Arsitektur Route Guarding:
  // isAuthenticated === true  => Render AppStack (Logged-In User)
  // isAuthenticated === false => Render AuthStack (Guest Mode)
  return isAuthenticated ? <AppStack /> : <AuthStack />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;
