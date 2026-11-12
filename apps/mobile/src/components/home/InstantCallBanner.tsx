import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

interface InstantCallBannerProps {
  onPressCall: () => void;
  isLoading?: boolean;
  etaText?: string;
}

export const InstantCallBanner: React.FC<InstantCallBannerProps> = ({
  onPressCall,
  isLoading = false,
  etaText = '10-15m ETA',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Left Accent Strip */}
        <View style={styles.accentStrip} />

        {/* Content Row */}
        <View style={styles.contentWrap}>
          {/* Flash Icon Box with Live Dot */}
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={22} color={THEME.colors.primary} />
            <View style={styles.livePulseDot} />
          </View>

          {/* Texts */}
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Instant Barber Call</Text>
              <View style={styles.liveTag}>
                <Text style={styles.liveTagText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Auto-dispatch nearest barber ({etaText})
            </Text>
          </View>

          {/* Dispatch Round Button */}
          <TouchableOpacity
            style={[styles.dispatchButton, isLoading && styles.dispatchButtonDisabled]}
            onPress={onPressCall}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityLabel="Panggil Barber Instan"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#003824" />
            ) : (
              <Ionicons name="navigate" size={19} color="#003824" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  card: {
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: THEME.borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: THEME.colors.primary,
  },
  contentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 20,
    gap: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78, 222, 163, 0.3)',
    position: 'relative',
  },
  livePulseDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.secondary,
    borderWidth: 1.5,
    borderColor: THEME.colors.surfaceContainer,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveTag: {
    backgroundColor: 'rgba(255, 185, 95, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 185, 95, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.secondary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#BBCABF',
  },
  dispatchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  dispatchButtonDisabled: {
    opacity: 0.6,
  },
});
