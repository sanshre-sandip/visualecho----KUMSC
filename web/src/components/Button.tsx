import type { CSSProperties, ReactNode } from "react";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

export type ButtonVariant = "primary" | "secondary" | "tertiary";

export interface ButtonProps {
  title: string;
  onClick: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: CSSProperties;
  textStyle?: CSSProperties;
  accessibilityLabel?: string;
  children?: ReactNode;
}

const baseStyle: CSSProperties = {
  minHeight: 56,
  borderRadius: BorderRadius.xlarge,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingLeft: Spacing.four,
  paddingRight: Spacing.four,
  flexDirection: "row",
  gap: Spacing.two,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: Colors.light.primary,
    color: Colors.light.primaryText,
  },
  secondary: {
    backgroundColor: Colors.light.surfaceVariant,
    color: Colors.light.primary,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: Colors.light.outline,
  },
  tertiary: {
    backgroundColor: "transparent",
    color: Colors.light.primary,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.two,
  },
};

export function Button({
  title,
  onClick,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const buttonStyle: CSSProperties = {
    ...baseStyle,
    ...variantStyles[variant],
    opacity: disabled ? 0.38 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    ...style,
  };

  const titleStyle: CSSProperties = {
    ...Typography.labelLarge,
    color: variant === "primary" ? Colors.light.primaryText : Colors.light.primary,
    fontWeight: 600,
    letterSpacing: 0.1,
    ...textStyle,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={accessibilityLabel ?? title}
      style={buttonStyle}
    >
      <span style={titleStyle}>{title}</span>
    </button>
  );
}
