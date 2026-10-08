import { View, Text, StyleSheet, TouchableOpacity, useState } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppConfiguration, AIMode } from "@/config/model";
import { saveConfiguration } from "@/config/service";

export default function ChooseAIScreen() {
  const navigation = useNavigation();
  const [selectedOption, setSelectedOption] = useState<AIMode>("local");
  const [config, setConfig] = useState<AppConfiguration>({
    setupCompleted: false,
    aiMode: "local",
    sttMode: "local",
    ttsMode: "local",
  });

  const onOptionPress = (mode: AIMode) => {
    setSelectedOption(mode);
    const newConfig: AppConfiguration = {
      setupCompleted: config.setupCompleted,
      aiMode: mode,
      sttMode: config.sttMode,
      ttsMode: config.ttsMode,
    };
    saveConfiguration(newConfig).then(() => {
      setConfig(newConfig);
      navigation.navigate("LocalComponents");
    });
  };

  const getLocalCardStyle = () => [
    styles.card,
    { backgroundColor: "#E8F0FE" },
    { borderColor: "#1B5E8C" },
    { borderWidth: 1 },
  ];

  const getCloudCardStyle = () => [
    styles.card,
    { backgroundColor: "#FFF" },
    { borderColor: "#CCC" },
    { borderWidth: 1 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your AI mode</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={getLocalCardStyle()} onPress={() => onOptionPress("local")}>
          <Text style={styles.cardText}>Private & Offline</Text>
          <Text style={styles.cardSubtext}>Run Gemma locally on your device.</Text>
          <Text style={styles.cardSubtext}>Works without an internet connection.</Text>
          <Text style={styles.cardSubtext}>No account required.</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={getCloudCardStyle()} onPress={() => onOptionPress("cloud")}>
          <Text style={styles.cardText}>Cloud AI</Text>
          <Text style={styles.cardSubtext}>Use a cloud-based language model for AI reasoning.</Text>
          <Text style={styles.cardSubtext}>Requires an internet connection.</Text>
          <Text style={styles.cardSubtext}>Account setup will be required later.</Text>
        </TouchableOpacity>
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
  cardContainer: {
    width: "100%",
    marginBottom: 16,
  },
  card: {
    minHeight: 120,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
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