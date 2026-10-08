import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

export default function PracticeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={[Typography.headlineSmall, styles.title]}>Daily Practice</Text>
        <Card variant="outlined" style={styles.statusCard}>
          <Text style={[Typography.titleLarge, styles.statusTitle]}>
            Speech practice is not available yet
          </Text>
          <Text style={[Typography.bodyMedium, styles.body]}>
            This build has no selected Android-compatible local Whisper or TTS runtime. No audio
            will be recorded, transcribed, or evaluated, and practice progress will not be marked
            complete.
          </Text>
          <Text style={[Typography.bodyMedium, styles.body]}>
            Local Gemma inference and the mobile connection to the cloud LLM also need to be
            connected before evaluation can run.
          </Text>
        </Card>
        <Button
          title="Back to Home"
          variant="primary"
          onPress={() => router.replace('/')}
          accessibilityLabel="Back to Home"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    color: Colors.light.onSurface,
    textAlign: 'center',
  },
  statusCard: {
    gap: Spacing.three,
  },
  statusTitle: {
    color: Colors.light.onSurface,
  },
  body: {
    color: Colors.light.onSurfaceVariant,
  },
});