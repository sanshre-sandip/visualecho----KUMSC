import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>VisualEcho</Text>
        <Text style={styles.description}>An accessible daily learning companion.</Text>

        <View style={styles.buttons}>
          <Link href="/practice" style={styles.button}>
            <Text>Practice</Text>
          </Link>

          <Link href="/drawing" style={styles.button}>
            <Text>Drawing</Text>
          </Link>

          <Link href="/progress" style={styles.button}>
            <Text>Progress</Text>
          </Link>

          <Link href="/settings" style={styles.button}>
            <Text>Settings</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  buttons: {
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B5E8C',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});