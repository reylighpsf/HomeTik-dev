import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';
import { ASSETS } from '@/constants/assets';

interface HeaderSectionProps {
  currentAddress?: string;
  onPressLocation?: () => void;
  onPressNotifications?: () => void;
  onPressProfile?: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  currentAddress = 'Jl. Pemuda No. 45, Surabaya',
  onPressLocation,
  onPressNotifications,
  onPressProfile,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Address & Actions Row */}
      <View style={styles.topRow}>
        {/* Antar ke: Address Chip */}
        <TouchableOpacity
          style={styles.addressChip}
          onPress={onPressLocation}
          activeOpacity={0.7}
        >
          <View style={styles.pinCircle}>
            <Ionicons name="location" size={14} color="#FFFFFF" />
          </View>
          <View style={styles.addressTextWrap}>
            <Text style={styles.deliverToText}>Antar ke</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {currentAddress}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={14} color="#00B14F" />
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onPressNotifications}
            activeOpacity={0.7}
            accessibilityLabel="Notifikasi"
          >
            <Ionicons name="notifications-outline" size={19} color="#00B14F" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={onPressProfile}
            activeOpacity={0.8}
            accessibilityLabel="Profil Pengguna"
          >
            <Image source={{ uri: ASSETS.userAvatar }} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.xs,
    paddingBottom: THEME.spacing.xs,
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  addressChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00B14F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextWrap: {
    flex: 1,
  },
  deliverToText: {
    fontSize: 9,
    color: '#00873D',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B14F',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#00B14F',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
});
