import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ChooseAIScreen({ onSelect }: { onSelect: (mode: string) => void }) {
  const handlePress = (mode: string) => {
    onSelect(mode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your AI mode</Text>

      <TouchableOpacity style={styles.card} onPress={() => handlePress("local")}>
        <Text style={styles.cardText}>Private & Offline</Text>
        <Text style={styles.cardSubtext}>Gemma&apos;s Android model source and runtime have not been selected yet.</Text>
        <Text style={styles.cardSubtext}>This mode cannot be prepared on this build.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => handlePress("cloud")}>
        <Text style={styles.cardText}>Cloud AI</Text>
        <Text style={styles.cardSubtext}>Requires a configured VisualEcho backend.</Text>
        <Text style={styles.cardSubtext}>Whisper and text-to-speech remain local-only.</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    minHeight: 140,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#F5F5F5",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#CCC",
  },
  cardText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1B5E8C",
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
});