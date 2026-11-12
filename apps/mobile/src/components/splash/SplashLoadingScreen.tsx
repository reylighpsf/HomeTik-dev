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
import { Ionicons } from '@expo/vector-icons';
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
  durationMs = 2400,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const glowScale = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo spring in
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // 2. Ambient glow loop
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.25,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.9,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // 3. Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs,
      useNativeDriver: false,
    }).start();

    // 4. Step text updates
    const stepInterval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, durationMs / LOADING_STEPS.length);

    // 5. Completion & smooth fade out
    const finishTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) {
          onFinish();
        }
      });
    }, durationMs);

    return () => {
      glowLoop.stop();
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
          {/* Outer glowing border ring holding the official Stitch icon */}
          <View style={styles.outerRing}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Brand Name */}
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>Hometik</Text>
          <View style={styles.brandDot} />
        </View>

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

      {/* Footer Protocol & Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>v1.0dd.0 • Premium Experience</Text>
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
    backgroundColor: THEME.colors.primary, // Pure Obsidian Black #000000
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: THEME.spacing.xxl,
  },
  emblemContainer: {
    marginBottom: THEME.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 104,
    height: 104,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(111, 251, 190, 0.4)',
    backgroundColor: 'rgba(19, 27, 46, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 0 30px rgba(111, 251, 190, 0.3)',
      },
      default: {
        shadowColor: THEME.colors.secondaryContainer,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
        elevation: 10,
      },
    }),
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  brandName: {
    fontSize: 34,
    fontWeight: '900',
    color: THEME.colors.textInverse,
    letterSpacing: -0.8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.secondaryContainer,
    marginLeft: 4,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.secondaryContainer,
    letterSpacing: 2,
    marginBottom: 36,
  },
  statusText: {
    fontSize: 13,
    color: THEME.colors.textInverseSecondary,
    marginBottom: 16,
    textAlign: 'center',
    minHeight: 20,
  },
  progressTrack: {
    width: SCREEN_WIDTH * 0.65,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: THEME.colors.secondaryContainer,
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    gap: 8,
  },
  safeShieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(111, 251, 190, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(111, 251, 190, 0.25)',
    gap: 6,
  },
  safeShieldText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.secondaryContainer,
  },
  versionText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
});
