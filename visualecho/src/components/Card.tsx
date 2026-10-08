import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export function Card({ children, style, variant = 'elevated' }: CardProps) {
  const baseStyle = styles.base;
  const variantStyle = styles[variant];

  return (
    <View style={[baseStyle, variantStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: Spacing.four,
  },
  elevated: {
    backgroundColor: Colors.light.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  outlined: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filled: {
    backgroundColor: Colors.light.backgroundElement,
  },
});