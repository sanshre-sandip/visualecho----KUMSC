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
        <Text style={styles.cardSubtext}>Run Gemma locally on your device.</Text>
        <Text style={styles.cardSubtext}>Works without an internet connection.</Text>
        <Text style={styles.cardSubtext}>No account required.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => handlePress("cloud")}>
        <Text style={styles.cardText}>Cloud AI</Text>
        <Text style={styles.cardSubtext}>Use a cloud-based language model for AI reasoning.</Text>
        <Text style={styles.cardSubtext}>Requires an internet connection.</Text>
        <Text style={styles.cardSubtext}>Account setup will be required later.</Text>
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