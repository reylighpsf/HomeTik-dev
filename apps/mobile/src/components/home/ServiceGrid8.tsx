import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

export interface ServiceGridItem {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  isSpecial?: boolean;
  badge?: string;
}

interface ServiceGrid8Props {
  onSelectService: (id: string) => void;
}

export const GRAB_SERVICES: ServiceGridItem[] = [
  {
    id: 'barber-kilat',
    title: 'Barber Kilat',
    icon: 'content-cut',
    isSpecial: true,
    badge: 'KILAT',
  },
  {
    id: 'booking-barber',
    title: 'Booking Barber',
    icon: 'calendar-month',
  },
  {
    id: 'haircut-anak',
    title: 'Haircut Anak',
    icon: 'child-care',
  },
  {
    id: 'safeshield',
    title: 'SafeShield™',
    icon: 'health-and-safety',
  },
  {
    id: 'spa',
    title: 'Beauty & Spa',
    icon: 'spa',
  },
  {
    id: 'cleaning',
    title: 'Home Cleaning',
    icon: 'cleaning-services',
  },
  {
    id: 'ac-repair',
    title: 'AC & Repair',
    icon: 'hvac',
  },
  {
    id: 'lainnya',
    title: 'Lainnya',
    icon: 'apps',
  },
];

export const ServiceGrid8: React.FC<ServiceGrid8Props> = ({ onSelectService }) => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {GRAB_SERVICES.map((item) => {
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => onSelectService(item.id)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.iconBox,
                  item.isSpecial ? styles.specialIconBox : styles.defaultIconBox,
                ]}
              >
                <MaterialIcons
                  name={item.icon}
                  size={26}
                  color={item.isSpecial ? '#FFFFFF' : '#00B14F'}
                />
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.itemTitle,
                  item.isSpecial ? styles.specialItemTitle : styles.defaultItemTitle,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  gridItem: {
    width: '23%',
    alignItems: 'center',
    gap: 7,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  defaultIconBox: {
    backgroundColor: '#E8F8F0',
  },
  specialIconBox: {
    backgroundColor: '#00B14F',
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#00B14F',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#00873D',
    letterSpacing: 0.3,
  },
  itemTitle: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  defaultItemTitle: {
    color: '#334155',
    fontWeight: '500',
  },
  specialItemTitle: {
    color: '#000000',
    fontWeight: '800',
  },
});
