import { useCallback, useState } from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadDemoProgress } from '@/services/demoProgress';
import type { DemoProgress } from '@/services/demoProgress';

export default function ProgressScreen() {
  const [progress, setProgress] = useState<DemoProgress>({ attempts: [], drawingsSaved: 0 });
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadDemoProgress().then((saved) => {
        if (active) {
          setProgress(saved);
          setError('');
        }
      }).catch(() => {
        if (active) setError('Saved demo progress could not be read on this device.');
      });
      return () => { active = false; };
    }, []),
  );

  const matches = progress.attempts.filter((attempt) => attempt.correct).length;
  const matchRate = progress.attempts.length
    ? Math.round((matches / progress.attempts.length) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>INTERACTIVE DEMO</Text>
        <Text style={styles.title}>Your progress</Text>
        <Text style={styles.description}>Only completed demo comparisons and saved demo drawings appear here.</Text>
        <View style={styles.metrics}>
          <Metric label="ATTEMPTS" value={progress.attempts.length} />
          <Metric label="MATCHED" value={matches} />
          <Metric label="DEMO MATCH RATE" value={`${matchRate}%`} />
          <Metric label="DRAWINGS SAVED" value={progress.drawingsSaved} />
        </View>
        {error ? <Text accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
        <Text style={styles.sectionTitle}>Recent demo attempts</Text>
        {progress.attempts.length === 0 ? (
          <Text style={styles.empty}>No demo attempts yet. Try a word in Practice to start your history.</Text>
        ) : (
          [...progress.attempts].reverse().slice(0, 20).map((attempt) => (
            <View key={attempt.id} style={styles.attemptRow}>
              <View style={styles.attemptWords}>
                <Text style={styles.target}>{attempt.targetWord}</Text>
                <Text style={styles.transcript}>Demo transcript: {attempt.transcript}</Text>
              </View>
              <View style={styles.attemptMeta}>
                <Text style={attempt.correct ? styles.match : styles.tryAgain}>{attempt.correct ? 'Matched' : 'Try again'}</Text>
                <Text style={styles.date}>{new Date(attempt.completedAt).toLocaleDateString()}</Text>
              </View>
            </View>
          ))
        )}
        <Link href="/" style={styles.backLink}>Back to Home</Link>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8faf8' },
  container: { flexGrow: 1, padding: 22, maxWidth: 600, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#557563', fontSize: 11, fontWeight: '700' },
  title: { marginTop: 6, color: '#19382d', fontSize: 28, fontWeight: '700' },
  description: { marginTop: 6, marginBottom: 18, color: '#50645b', fontSize: 13, lineHeight: 19 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  metric: { flexGrow: 1, flexBasis: '45%', minHeight: 75, padding: 12, borderRadius: 7, backgroundColor: '#eaf0eb' },
  metricLabel: { color: '#557563', fontSize: 9, fontWeight: '700' },
  metricValue: { marginTop: 8, color: '#19382d', fontSize: 22, fontWeight: '700' },
  sectionTitle: { marginBottom: 8, color: '#19382d', fontSize: 18, fontWeight: '700' },
  empty: { padding: 14, borderWidth: 1, borderColor: '#dce6de', borderRadius: 7, color: '#50645b', fontSize: 13, lineHeight: 19, backgroundColor: '#fff' },
  attemptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#dce6de' },
  attemptWords: { flex: 1 },
  target: { color: '#19382d', fontSize: 15, fontWeight: '700' },
  transcript: { marginTop: 3, color: '#61756a', fontSize: 12 },
  attemptMeta: { alignItems: 'flex-end' },
  match: { color: '#26714f', fontSize: 12, fontWeight: '700' },
  tryAgain: { color: '#89542e', fontSize: 12, fontWeight: '700' },
  date: { marginTop: 4, color: '#718178', fontSize: 10 },
  error: { marginBottom: 14, color: '#a23d31', fontSize: 13 },
  backLink: { marginTop: 22, color: '#26714f', fontWeight: '600' },
});