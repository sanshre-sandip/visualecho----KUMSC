import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function DrawingScreen() {
  return (
    <View style={styles.container}>
      <Link href="/" style={styles.backLink}>
        <Text>← Back to Home</Text>
      </Link>
      <Text style={styles.title}>Drawing</Text>
      <Text style={styles.placeholder}>Drawing canvas will be available after practice completion.</Text>
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
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  backLink: {
    marginBottom: 24,
    fontSize: 14,
    color: '#1B5E8C',
  },
});