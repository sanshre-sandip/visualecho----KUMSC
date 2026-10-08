export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#4A5560',
    background: '#FFFFFF',
    backgroundElement: '#F1F3F5',
    border: '#D6DCE1',
    primary: '#1B5E8C',
    primaryText: '#FFFFFF',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#B9C2CB',
    background: '#0E1114',
    backgroundElement: '#1B2126',
    border: '#2C343B',
    primary: '#7FB6DA',
    primaryText: '#0E1114',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
} as const;

export const MaxContentWidth = 600;