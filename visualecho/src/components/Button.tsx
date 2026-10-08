import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

const baseStyles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: BorderRadius.xlarge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  primary: {
    backgroundColor: Colors.light.primary,
  },
  primaryTitle: {
    ...Typography.labelLarge,
    color: Colors.light.onPrimaryContainer,
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: Colors.light.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.light.outline,
  },
  secondaryTitle: {
    ...Typography.labelLarge,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  tertiary: {
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.two,
  },
  tertiaryTitle: {
    ...Typography.labelLarge,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.38,
  },
  disabledTitle: {
    opacity: 0.38,
  },
  pressed: {
    opacity: 0.8,
  },
  title: {
    letterSpacing: 0.1,
  },
});

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  primary: baseStyles.primary,
  secondary: baseStyles.secondary,
  tertiary: baseStyles.tertiary,
};

const VARIANT_TITLE_STYLES: Record<ButtonVariant, TextStyle> = {
  primary: baseStyles.primaryTitle,
  secondary: baseStyles.secondaryTitle,
  tertiary: baseStyles.tertiaryTitle,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const buttonStyle = [
    baseStyles.base,
    VARIANT_STYLES[variant],
    disabled && baseStyles.disabled,
    style,
  ];

  const titleStyle = [
    baseStyles.title,
    VARIANT_TITLE_STYLES[variant],
    disabled && baseStyles.disabledTitle,
    textStyle,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        buttonStyle,
        pressed && !disabled && baseStyles.pressed,
      ]}>
      <Text style={titleStyle}>{title}</Text>
    </Pressable>
  );
}