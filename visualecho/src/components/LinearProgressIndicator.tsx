import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

interface LinearProgressIndicatorProps {
  progress: number;
  style?: ViewStyle;
  trackColor?: string;
  indicatorColor?: string;
  height?: number;
}

export function LinearProgressIndicator({
  progress,
  style,
  trackColor = Colors.light.outlineVariant,
  indicatorColor = Colors.light.primary,
  height = 4,
}: LinearProgressIndicatorProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={[styles.track, { backgroundColor: trackColor, height }]} />
      <View
        style={[
          styles.indicator,
          { backgroundColor: indicatorColor, height },
          { width: `${clampedProgress * 100}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: BorderRadius.full,
    backgroundColor: 'transparent',
  },
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.full,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: BorderRadius.full,
  },
});