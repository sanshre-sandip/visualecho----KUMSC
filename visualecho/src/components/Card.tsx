import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: keyof typeof Spacing;
}

export function Card({
  children,
  style,
  variant = 'elevated',
  padding = 'four',
}: CardProps) {
  const baseStyle = styles.base;
  const variantStyle = styles[variant];
  const paddingStyle = { padding: Spacing[padding] };

  return (
    <View style={[baseStyle, variantStyle, paddingStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.large,
  },
  elevated: {
    backgroundColor: Colors.light.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: Elevation.level2,
    elevation: Elevation.level1,
  },
  outlined: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.outline,
  },
  filled: {
    backgroundColor: Colors.light.surfaceVariant,
  },
});