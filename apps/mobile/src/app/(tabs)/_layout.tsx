import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.activeIconWrap}>
              {focused && <View style={styles.topIndicator} />}
              <MaterialIcons name="home" size={24} color={color as string} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bookings/index"
        options={{
          title: 'Aktivitas',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="receipt-long" size={22} color={color as string} />
              <View style={styles.activityBadge} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="services/index"
        options={{
          title: 'Layanan',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="grid-view" size={23} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    height: 64,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarItem: {
    height: 48,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  activeIconWrap: {
    alignItems: 'center',
    position: 'relative',
  },
  topIndicator: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: THEME.colors.primary,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.secondary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
