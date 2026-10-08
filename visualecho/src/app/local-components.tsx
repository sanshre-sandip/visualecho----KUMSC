import { View, Text, StyleSheet } from "react-native";

export default function LocalComponentsScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Local audio processing</Text>
      <Text style={styles.subtext}>
        Speech recognition and voice generation stay on your device.
      </Text>

      <View style={styles.componentBox}>
        <Text style={styles.componentLabel}>Speech Recognition</Text>
        <Text style={styles.componentValue}>Local Whisper</Text>
      </View>

      <View style={styles.componentBox}>
        <Text style={styles.componentLabel}>Text to Speech</Text>
        <Text style={styles.componentValue}>Local TTS</Text>
      </View>

      <Text style={styles.note}>These are required components and cannot be disabled.</Text>
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
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    color: "#555",
  },
  componentBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
    width: "100%",
    marginBottom: 16,
  },
  componentLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  componentValue: {
    fontFamily: "monospace",
    color: "#1B5E8C",
  },
  note: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 24,
  },
});