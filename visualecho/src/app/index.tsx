import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { loadConfiguration } from '@/config/service';
import { loadDemoProgress } from '@/services/demoProgress';
import type { DemoProgress } from '@/services/demoProgress';

export default function HomeScreen() {
  const [mode, setMode] = useState<'local' | 'cloud'>('local');
  const [progress, setProgress] = useState<DemoProgress>({ attempts: [], drawingsSaved: 0 });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([loadConfiguration(), loadDemoProgress()]).then(([config, saved]) => {
        if (!active) return;
        setMode(config.aiMode === 'cloud' ? 'cloud' : 'local');
        setProgress(saved);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const matches = progress.attempts.filter((attempt) => attempt.correct).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>YOUR PRACTICE SPACE</Text>
            <Text style={styles.title}>VisualEcho</Text>
          </View>
          <View style={styles.demoBadge}><Text style={styles.demoBadgeText}>INTERACTIVE DEMO</Text></View>
        </View>
        <Text style={styles.description}>A calm place to explore word practice at your own pace.</Text>
        <View style={styles.modePanel}>
          <Text style={styles.modeLabel}>Selected mode</Text>
          <Text style={styles.modeValue}>{mode === 'local' ? 'Private & Offline' : 'Cloud AI'}</Text>
          <Text style={styles.modeNote}>Demo interactions only. No speech model or cloud request is running.</Text>
        </View>
        <Text style={styles.sectionTitle}>Choose your next step</Text>
        <View style={styles.actions}>
          <Link href="/practice" style={styles.actionLink}>
            <Text style={styles.actionKicker}>WORD PRACTICE</Text>
            <Text style={styles.actionTitle}>Practice a word</Text>
            <Text style={styles.actionText}>Try a clear demo listen, recording, and feedback flow.</Text>
            <Text style={styles.actionCta}>Open practice  →</Text>
          </Link>
          <Link href="/drawing" style={styles.actionLink}>
            <Text style={styles.actionKicker}>CREATIVE BREAK</Text>
            <Text style={styles.actionTitle}>Draw something</Text>
            <Text style={styles.actionText}>Use a simple touch canvas and save a demo session.</Text>
            <Text style={styles.actionCta}>Open drawing  →</Text>
          </Link>
        </View>
        <View style={styles.metrics}>
          <Metric label="DEMO ATTEMPTS" value={progress.attempts.length} />
          <Metric label="MATCHED WORDS" value={matches} />
          <Metric label="DRAWING SESSIONS" value={progress.drawingsSaved} />
        </View>
        <View style={styles.footerLinks}>
          <Link href="/progress" style={styles.footerLink}>View progress</Link>
          <Link href="/settings" style={styles.footerLink}>Settings</Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8faf8',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  eyebrow: { color: '#557563', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#19382d',
  },
  description: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 20,
    color: '#50645b',
  },
  demoBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 5, backgroundColor: '#e8efe9' },
  demoBadgeText: { color: '#315b43', fontSize: 10, fontWeight: '700' },
  modePanel: { padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#dce6de', borderRadius: 8, backgroundColor: '#fff' },
  modeLabel: { color: '#61756a', fontSize: 12 },
  modeValue: { marginTop: 4, color: '#19382d', fontSize: 17, fontWeight: '700' },
  modeNote: { marginTop: 6, color: '#61756a', fontSize: 12, lineHeight: 18 },
  sectionTitle: { marginBottom: 12, color: '#19382d', fontSize: 20, fontWeight: '700' },
  actions: { gap: 12 },
  actionLink: { padding: 16, borderWidth: 1, borderColor: '#dce6de', borderRadius: 8, backgroundColor: '#fff' },
  actionKicker: { color: '#557563', fontSize: 10, fontWeight: '700' },
  actionTitle: { marginTop: 7, color: '#19382d', fontSize: 18, fontWeight: '700' },
  actionText: { marginTop: 5, color: '#50645b', fontSize: 13, lineHeight: 19 },
  actionCta: { marginTop: 12, color: '#26714f', fontSize: 13, fontWeight: '700' },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 18 },
  metric: { flex: 1, minHeight: 78, padding: 11, borderRadius: 7, backgroundColor: '#eaf0eb' },
  metricLabel: { color: '#557563', fontSize: 9, fontWeight: '700' },
  metricValue: { marginTop: 8, color: '#19382d', fontSize: 22, fontWeight: '700' },
  footerLinks: { flexDirection: 'row', gap: 20, marginTop: 20 },
  footerLink: { color: '#26714f', fontWeight: '600' },
});