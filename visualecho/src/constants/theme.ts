export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#4A5560',
    background: '#FFFFFF',
    backgroundElement: '#F1F3F5',
    border: '#D6DCE1',
    primary: '#1B5E8C',
    primaryText: '#FFFFFF',
    primaryContainer: '#D6E4F0',
    onPrimaryContainer: '#0D2A42',
    secondary: '#4A5560',
    secondaryContainer: '#D6E4E9',
    onSecondaryContainer: '#0B1E20',
    tertiary: '#6B4E00',
    tertiaryContainer: '#FFDD8A',
    onTertiaryContainer: '#221900',
    surface: '#FFFFFF',
    onSurface: '#11181C',
    surfaceVariant: '#F1F3F5',
    onSurfaceVariant: '#4A5560',
    outline: '#D6DCE1',
    outlineVariant: '#E8EAED',
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    success: '#006C1A',
    successContainer: '#D6F5DC',
    onSuccessContainer: '#002309',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#B9C2CB',
    background: '#0E1114',
    backgroundElement: '#1B2126',
    border: '#2C343B',
    primary: '#7FB6DA',
    primaryText: '#0E1114',
    primaryContainer: '#0D2A42',
    onPrimaryContainer: '#D6E4F0',
    secondary: '#B9C2CB',
    secondaryContainer: '#0B1E20',
    onSecondaryContainer: '#D6E4E9',
    tertiary: '#FFDD8A',
    tertiaryContainer: '#221900',
    onTertiaryContainer: '#FFDD8A',
    surface: '#0E1114',
    onSurface: '#FFFFFF',
    surfaceVariant: '#1B2126',
    onSurfaceVariant: '#B9C2CB',
    outline: '#2C343B',
    outlineVariant: '#3B4247',
    error: '#FFB4AB',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    success: '#A8E6B3',
    successContainer: '#002309',
    onSuccessContainer: '#D6F5DC',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  zero: 0,
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const BorderRadius = {
  none: 0,
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 28,
  full: 9999,
} as const;

export const Typography = {
  displayLarge: {
    fontSize: 57,
    fontWeight: '400' as const,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: '400' as const,
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: '400' as const,
    lineHeight: 44,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const;

export const Elevation = {
  level0: 0,
  level1: 1,
  level2: 2,
  level3: 4,
  level4: 8,
  level5: 16,
} as const;

export const MaxContentWidth = 600;

export const Breakpoints = {
  phone: 0,
  tablet: 600,
  desktop: 840,
} as const;