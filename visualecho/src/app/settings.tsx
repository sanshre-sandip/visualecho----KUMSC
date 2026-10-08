import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Link href="/" style={styles.backLink}>
        <Text>← Back to Home</Text>
      </Link>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.sections}>
        <Text style={styles.sectionTitle}>AI Provider</Text>
        <Text style={styles.sectionPlaceholder}>Provider selection not yet implemented.</Text>

        <Text style={styles.sectionTitle}>Speech-to-Text Provider</Text>
        <Text style={styles.sectionPlaceholder}>Provider selection not yet implemented.</Text>

        <Text style={styles.sectionTitle}>Text-to-Speech Provider</Text>
        <Text style={styles.sectionPlaceholder}>Provider selection not yet implemented.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  sections: {
    gap: 16,
    width: '100%',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1B5E8C',
  },
  sectionPlaceholder: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  backLink: {
    marginBottom: 24,
    fontSize: 14,
    color: '#1B5E8C',
  },
});