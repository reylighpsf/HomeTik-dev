export const THEME = {
  colors: {
    // Brand Primary & Accents (Grab-Style Fresh Emerald & Amber)
    primary: '#54d18c', // Official Grab Vibrant Emerald
    primaryDark: '#00873D',
    primaryContainer: '#E8F8F0', // Soft mint surface
    primaryFixed: '#C6F6D5',
    secondary: '#F59E0B', // Warm Amber / Gold
    secondaryDark: '#B45309',
    secondaryContainer: '#FEF3C7', // Soft warm amber surface
    secondaryLight: '#FFFBEB',
    accentMint: '#10B981',
    accentGold: '#D97706',
    accentTeal: '#0D9488',
    accentTealBg: '#CCFBF1',
    accentOrange: '#EA580C',
    accentOrangeBg: '#FFEDD5',

    // Surfaces & Backgrounds (Clean, Friendly White & Slate)
    background: '#F8FAFC', // Ultra-clean light background
    surface: '#FFFFFF', // Pure white card surface
    surfaceSubtle: '#F1F5F9', // Soft subtle container
    surfaceContainerLow: '#FFFFFF',
    surfaceContainer: '#F1F5F9',
    surfaceContainerHigh: '#E2E8F0',
    surfaceContainerHighest: '#CBD5E1',
    border: '#E2E8F0', // Clean border
    borderSubtle: '#F1F5F9',

    // Text & Content (High contrast for all ages)
    textPrimary: '#0F172A', // Deep slate black
    textSecondary: '#334155', // Slate gray
    textMuted: '#64748B', // Medium muted slate
    textInverse: '#FFFFFF', // White text on dark/colored buttons
    textInverseSecondary: '#94A3B8',

    // Status Colors
    statusPending: '#D97706',
    statusPendingBg: '#FEF3C7',
    statusSuccess: '#00B14F',
    statusSuccessBg: '#E8F8F0',
    statusInProgress: '#0284C7',
    statusInProgressBg: '#E0F2FE',
    statusCancelled: '#DC2626',
    statusCancelledBg: '#FEE2E2',

    // Overlays & Shadows
    overlayDark: 'rgba(15, 23, 42, 0.6)',
    glowEmerald: 'rgba(0, 177, 79, 0.2)',
    glowAmber: 'rgba(245, 158, 11, 0.2)',
    glowMint: 'rgba(16, 185, 129, 0.15)',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    hero: 32,
  },

  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  shadows: {
    subtle: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 3,
    },
    floating: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 6,
    },
  },
} as const;
