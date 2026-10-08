import { useState } from 'react';
import { ScrollView, Text, TextInput, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { appendDemoAttempt } from '@/services/demoProgress';

const DEMO_WORDS = ['cat', 'sun', 'book', 'fish', 'tree'];

interface DemoResult {
  transcript: string;
  correct: boolean;
}

export default function PracticeScreen() {
  const [wordIndex, setWordIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<DemoResult | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const currentWord = DEMO_WORDS[wordIndex];

  function simulateListen() {
    setNotice(`Demo playback selected: “${currentWord}”. No audio was generated.`);
  }

  function simulateRecording() {
    setTranscript(currentWord);
    setResult(null);
    setNotice('Demo recording supplied a sample transcript. No microphone was used.');
  }

  async function checkAttempt() {
    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) return;

    const correct = cleanTranscript.localeCompare(currentWord, undefined, { sensitivity: 'accent' }) === 0;
    setError('');
    setIsSaving(true);
    try {
      await appendDemoAttempt({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        targetWord: currentWord,
        transcript: cleanTranscript,
        correct,
        aiMode: 'local',
        completedAt: new Date().toISOString(),
      });
      setResult({ transcript: cleanTranscript, correct });
      setNotice('Demo comparison only. No Whisper or LLM ran.');
    } catch {
      setError('This attempt could not be saved on the device. Check storage and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function selectWord(index: number) {
    setWordIndex(index);
    setTranscript('');
    setResult(null);
    setNotice('');
    setError('');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>INTERACTIVE DEMO</Text>
        <Text style={styles.title}>Practice a word</Text>
        <Text style={styles.description}>Try the flow with sample words. Demo actions do not use audio or an AI model.</Text>

        <Text style={styles.stepLabel}>WORD {wordIndex + 1} OF {DEMO_WORDS.length}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.word}>{currentWord}</Text>

        <Button title="Simulate listen" variant="secondary" onPress={simulateListen} />
        <TextInput
          accessibilityLabel="Demo transcript"
          value={transcript}
          onChangeText={(value) => { setTranscript(value); setResult(null); }}
          onSubmitEditing={() => void checkAttempt()}
          placeholder="Type a demo transcript"
          returnKeyType="done"
          maxLength={120}
          style={styles.input}
        />
        <Button title="Simulate recording" variant="secondary" onPress={simulateRecording} />
        <Button
          title={isSaving ? 'Saving demo attempt…' : 'Check demo attempt'}
          onPress={() => void checkAttempt()}
          disabled={!transcript.trim() || isSaving}
        />

        {notice ? <Text accessibilityLiveRegion="polite" style={styles.note}>{notice}</Text> : null}
        {error ? <Text accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
        {result ? (
          <Text accessibilityLiveRegion="polite" style={result.correct ? styles.success : styles.tryAgain}>
            {result.correct ? 'Nice work!' : 'Keep practicing!'} Target: {currentWord}. Demo transcript: {result.transcript}.
          </Text>
        ) : null}

        <View style={styles.wordList}>
          {DEMO_WORDS.map((word, index) => (
            <Button
              key={word}
              title={`${index + 1}. ${word}`}
              variant={index === wordIndex ? 'primary' : 'tertiary'}
              onPress={() => selectWord(index)}
              style={styles.wordButton}
            />
          ))}
        </View>
        <Link href="/" style={styles.backLink}>Back to Home</Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8faf8' },
  content: {
    flexGrow: 1,
    gap: 14,
    padding: 22,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: { color: '#557563', fontSize: 11, fontWeight: '700' },
  title: { color: '#19382d', fontSize: 27, fontWeight: '700' },
  description: { color: '#50645b', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  stepLabel: { color: '#557563', fontSize: 11, fontWeight: '700' },
  word: { paddingVertical: 14, color: '#19382d', fontSize: 48, fontWeight: '700', textAlign: 'center' },
  input: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: '#cbd8cf', borderRadius: 7, backgroundColor: '#fff', color: '#19382d', fontSize: 16 },
  note: { color: '#50645b', fontSize: 12, lineHeight: 18 },
  error: { color: '#a23d31', fontSize: 13, lineHeight: 19 },
  success: { padding: 14, borderRadius: 7, backgroundColor: '#e7f3e9', color: '#245b35', fontSize: 14, lineHeight: 20 },
  tryAgain: { padding: 14, borderRadius: 7, backgroundColor: '#fff2e6', color: '#74451f', fontSize: 14, lineHeight: 20 },
  wordList: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  wordButton: { minHeight: 42 },
  backLink: { color: '#26714f', fontWeight: '600', marginTop: 6 },
});