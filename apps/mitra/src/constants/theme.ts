export const MITRA_THEME = {
  colors: {
    // Stitch Emerald Palette
    primary: '#006948',
    primaryContainer: '#00855D',
    primaryDark: '#005137',
    primaryLight: '#E6F4EA',
    primaryFixed: '#85F8C4',
    primaryFixedDim: '#68DBA9',
    
    // Backgrounds & Surfaces
    background: '#F8F9FD',
    surface: '#FBF8FF',
    surfaceLowest: '#FFFFFF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F4F2FD',
    surfaceContainer: '#EEEDF7',
    surfaceContainerHigh: '#E8E7F1',
    surfaceContainerHighest: '#E3E1EC',
    
    // Text & Content
    textPrimary: '#1A1B22',
    textSecondary: '#3D4A42',
    textMuted: '#6D7A72',
    textInverse: '#FFFFFF',
    
    // Status & Accents
    success: '#006948',
    successLight: '#F5FFF7',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    info: '#2563EB',
    infoLight: '#EFF6FF',
    
    // Borders
    border: '#E3E1EC',
    borderSubtle: '#EEEDF7',
    outline: '#6D7A72',
    outlineVariant: '#BCCAC0',
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
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
  shadows: {
    card: {
      shadowColor: '#1A1B22',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    hover: {
      shadowColor: '#1A1B22',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  },
} as const;
