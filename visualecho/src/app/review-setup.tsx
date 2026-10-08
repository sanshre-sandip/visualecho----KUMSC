import { View, Text, StyleSheet, Button } from "react-native";

export default function ReviewSetupScreen({
  aiMode,
  onBack,
  onComplete,
  onTryDemo,
}: {
  aiMode: string;
  onBack: () => void;
  onComplete: () => void;
  onTryDemo: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review your setup</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryRowLabel}>AI</Text>
        <Text style={styles.summaryRowValue}>
          {aiMode === "local" ? "Private & Offline" : "Cloud AI"}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryRowLabel}>Speech Recognition</Text>
        <Text style={styles.summaryRowValue}>Whisper — Local</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryRowLabel}>Text to Speech</Text>
        <Text style={styles.summaryRowValue}>TTS — Local</Text>
      </View>

      <Text style={styles.privacyMode}>
        Real setup only completes after the required models and runtimes are verified.
</Text>

      <View style={styles.buttons}>
        <Button title="Back" onPress={onBack} />
        <Button title="Set Up VisualEcho" onPress={onComplete} />
        <Button title="Try the interactive demo" onPress={onTryDemo} />
      </View>
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
  summaryBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 20,
    width: "100%",
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryRowLabel: {
    fontSize: 14,
    color: "#333",
  },
  summaryRowValue: {
    fontSize: 14,
    color: "#1B5E8C",
    fontWeight: "500",
  },
  privacyMode: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 24,
  },
});