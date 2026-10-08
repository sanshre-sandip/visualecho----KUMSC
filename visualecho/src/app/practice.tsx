import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LinearProgressIndicator } from '@/components/LinearProgressIndicator';

const MOCK_WORDS = ['cat', 'sun', 'book', 'fish', 'tree'];

type PracticePhase = 'practicing' | 'completed';

export default function PracticeScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<PracticePhase>('practicing');
  const [lastAction, setLastAction] = useState<string | null>(null);

  const currentWord = MOCK_WORDS[currentIndex];
  const totalWords = MOCK_WORDS.length;
  const progress = (currentIndex + 1) / totalWords;
  const isLastWord = currentIndex === totalWords - 1;

  const handleNext = useCallback(() => {
    if (isLastWord) {
      setPhase('completed');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setLastAction(null);
    }
  }, [isLastWord]);

  const handleSpeak = useCallback(() => {
    setLastAction('Speech recognition will be available soon.');
  }, []);

  const handleListen = useCallback(() => {
    setLastAction('Audio playback will be available soon.');
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setPhase('practicing');
    setLastAction(null);
  }, []);

  const handleBackToHome = useCallback(() => {
    router.replace('/');
  }, [router]);

  if (phase === 'completed') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Card variant="filled" style={styles.completionCard}>
              <View style={styles.completionIcon}>
                <Text style={styles.completionIconText}>✓</Text>
              </View>
              <Text style={[Typography.headlineMedium, styles.completionTitle]}>Practice Complete</Text>
              <Text style={[Typography.bodyLarge, styles.completionDescription]}>
                You completed today&apos;s practice.
              </Text>
              <View style={styles.completionActions}>
                <Button
                  title="Practice Again"
                  variant="secondary"
                  onPress={handleRestart}
                  accessibilityLabel="Practice again"
                />
                <Button
                  title="Back to Home"
                  variant="primary"
                  onPress={handleBackToHome}
                  accessibilityLabel="Back to Home"
                />
              </View>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Top area - Title and Progress */}
          <View style={styles.header}>
            <Text style={[Typography.headlineSmall, styles.screenTitle]}>Daily Practice</Text>
            <View style={styles.progressContainer}>
              <Text style={[Typography.titleSmall, styles.progressText]}>
                Word {currentIndex + 1} of {totalWords}
              </Text>
              <LinearProgressIndicator progress={progress} style={styles.progressBar} />
            </View>
          </View>

          {/* Main content - Practice Word Card */}
          <Card variant="elevated" style={styles.wordCard}>
            <Text style={[Typography.displaySmall, styles.wordText]}>{currentWord}</Text>
          </Card>

          {/* Instruction */}
          <Text style={[Typography.bodyMedium, styles.instruction]}>
            Listen to the word, then say it aloud.
          </Text>

          {/* Action feedback */}
          {lastAction && (
            <View style={styles.feedbackContainer}>
              <Text style={[Typography.bodySmall, styles.feedbackText]}>{lastAction}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Speak"
              variant="primary"
              onPress={handleSpeak}
              accessibilityLabel="Speak the word"
              style={styles.primaryAction}
            />
            <View style={styles.secondaryActions}>
              <Button
                title="Listen"
                variant="secondary"
                onPress={handleListen}
                accessibilityLabel="Listen to the word"
              />
              <Button
                title={isLastWord ? 'Finish' : 'Next'}
                variant="tertiary"
                onPress={handleNext}
                accessibilityLabel={isLastWord ? 'Finish practice' : 'Next word'}
              />
            </View>
          </View>

          {/* Back to Home */}
          <View style={styles.backLinkContainer}>
            <Link href="/" style={styles.backLink}>
              <Text style={styles.backLinkText}>← Back to Home</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    width: '100%',
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  screenTitle: {
    color: Colors.light.onSurface,
    textAlign: 'center',
  },
  progressContainer: {
    gap: Spacing.one,
  },
  progressText: {
    color: Colors.light.onSurfaceVariant,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
  },
  wordCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    width: '100%',
  },
  wordText: {
    color: Colors.light.onSurface,
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0,
  },
  instruction: {
    color: Colors.light.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  feedbackContainer: {
    backgroundColor: Colors.light.primaryContainer,
    borderRadius: BorderRadius.medium,
    padding: Spacing.three,
  },
  feedbackText: {
    color: Colors.light.onPrimaryContainer,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  primaryAction: {
    width: '100%',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  backLinkContainer: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.outlineVariant,
  },
  backLink: {
    alignItems: 'center',
  },
  backLinkText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  completionCard: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    width: '100%',
  },
  completionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  completionIconText: {
    fontSize: 40,
    color: Colors.light.success,
    lineHeight: 48,
  },
  completionTitle: {
    color: Colors.light.onSurface,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  completionDescription: {
    color: Colors.light.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.five,
    maxWidth: 300,
  },
  completionActions: {
    width: '100%',
    flexDirection: 'column',
    gap: Spacing.three,
  },
});