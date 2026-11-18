import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SplashLoadingScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

const LOADING_STEPS = [
  'Siap melayani Anda!',
];

export const SplashLoadingScreen: React.FC<SplashLoadingScreenProps> = ({
  onFinish,
  durationMs = 2200,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Animation controllers
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const glowScale = useRef(new Animated.Value(0.95)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo spring entrance
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 6,
      tension: 45,
      useNativeDriver: true,
    }).start();

    // 3. Progress bar linear fill
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs,
      useNativeDriver: false,
    }).start();

    // 4. Dynamic status text rotation
    const stepInterval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, durationMs / LOADING_STEPS.length);

    // 5. Smooth fade out completion
    const finishTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) {
          onFinish();
        }
      });
    }, durationMs);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(finishTimer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background Soft Aura Lighting (Pulsing Emerald Ambient) */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Center Brand Identity */}
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.emblemContainer,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Outer Squircle Container with Soft Shadow */}
          <View style={styles.outerRing}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Brand Name (Obsidian Black with Emerald Dot) */}
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>Hometik</Text>
          <View style={styles.brandDot} />
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>ON-DEMAND GROOMING SERVICE</Text>

        {/* Dynamic Loading Step Text */}
        <Text style={styles.statusText}>{LOADING_STEPS[currentStepIdx]}</Text>

        {/* Progress Bar Container */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
      </View>

      {/* Footer Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>v1.0.0 • Layanan Cukur Terpercaya</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    backgroundColor: '#FFFFFF', // Clean Pure Pearl White
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: (SCREEN_WIDTH * 0.8) / 2,
    backgroundColor: 'rgba(0, 177, 79, 0.08)', // Soft Mint Ambient Glow
    ...Platform.select({
      web: {
        filter: 'blur(50px)',
      },
    }),
  },
  centerContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 28,
  },
  emblemContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A', // Obsidian Black (High Contrast & User Friendly)
    letterSpacing: -0.8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B14F', // Grab Vibrant Emerald Green
    marginLeft: 4,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00873D', // Deep Emerald Green
    letterSpacing: 1.8,
    marginBottom: 28,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B', // Soft Slate Gray
    marginBottom: 14,
    textAlign: 'center',
    minHeight: 20,
  },
  progressTrack: {
    width: SCREEN_WIDTH * 0.6,
    height: 5,
    backgroundColor: '#F1F5F9', // Soft light slate track
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00B14F', // Grab Emerald Green indicator
    borderRadius: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
});
