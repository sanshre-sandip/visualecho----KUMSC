import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ModelDefinition } from "@/models/ModelDefinition";
import type { ModelStatus } from "@/models/ModelStatus";
import type { ModelSetupPhase } from "@/models/ModelManager";

export type SetupProgressPhase = "idle" | ModelSetupPhase | "error" | "complete";

interface SetupProgressScreenProps {
  aiMode: "local" | "cloud";
  phase: SetupProgressPhase;
  models: readonly ModelDefinition[];
  statuses: readonly ModelStatus[];
  message: string | null;
  onStart: () => void;
  onCancel: () => void;
  onContinue: () => void;
  onBack: () => void;
}

const phaseLabels: Record<SetupProgressPhase, string> = {
  idle: "Models need setup",
  preparing: "Preparing setup",
  checking_device: "Checking device storage",
  checking_models: "Checking required models",
  installing_models: "Installing required models",
  verifying_installation: "Verifying installation",
  error: "Setup needs attention",
  complete: "Setup complete",
};

function statusLabel(status: ModelStatus | undefined): string {
  switch (status?.state) {
    case "installed":
      return "Installed and verified";
    case "checking":
      return "Checking";
    case "queued":
      return "Waiting";
    case "downloading":
      return "Downloading";
    case "verifying":
      return "Verifying files";
    case "error":
      return "Needs attention";
    default:
      return "Waiting";
  }
}

export default function SetupProgressScreen({
  aiMode,
  phase,
  models,
  statuses,
  message,
  onStart,
  onCancel,
  onContinue,
  onBack,
}: SetupProgressScreenProps) {
  const active =
    phase === "preparing" ||
    phase === "checking_device" ||
    phase === "checking_models" ||
    phase === "installing_models" ||
    phase === "verifying_installation";
  const actionLabel =
    phase === "complete"
      ? "Continue to Home"
      : phase === "error"
        ? "Retry"
        : phase === "idle"
          ? "Set Up VisualEcho"
          : "Cancel setup";
  const onAction = phase === "complete" ? onContinue : active ? onCancel : onStart;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {phase === "complete" ? "VisualEcho is ready" : "Setting up VisualEcho"}
      </Text>
      <Text style={styles.mode}>
        {aiMode === "local" ? "Private & Offline" : "Cloud AI"}
        {aiMode === "cloud" ? " selected; speech models remain on-device" : " selected"}
      </Text>
      <Text accessibilityLiveRegion="polite" style={styles.phase}>
        {phaseLabels[phase]}
      </Text>

      {aiMode === "cloud" && (
        <View style={styles.cloudRow}>
          <Text style={styles.cloudTitle}>Cloud LLM</Text>
          <Text style={styles.cloudStatus}>Selected; no local Gemma download</Text>
        </View>
      )}

      <View style={styles.modelList}>
        {models.map((model) => {
          const status = statuses.find((item) => item.modelId === model.id);
          const progress =
            status?.state === "downloading" && status.progress !== null
              ? Math.round(status.progress * 100)
              : null;

          return (
            <View key={model.id} style={styles.modelRow}>
              <View style={styles.modelHeading}>
                <Text style={styles.modelName}>{model.name}</Text>
                <Text
                  style={
                    status?.state === "error" ? styles.errorStatus : styles.status
                  }
                >
                  {progress === null ? statusLabel(status) : `${progress}%`}
                </Text>
              </View>
              {progress !== null && (
                <View
                  accessibilityRole="progressbar"
                  accessibilityValue={{ min: 0, max: 100, now: progress }}
                  style={styles.progressTrack}
                >
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              )}
              {status?.error && <Text style={styles.errorMessage}>{status.error}</Text>}
            </View>
          );
        })}
      </View>

      {message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
      {phase === "complete" && (
        <Text style={styles.completeNote}>Required local models are verified.</Text>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={active && phase !== "installing_models"}
        onPress={onAction}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
          active && phase !== "installing_models" && styles.disabledButton,
        ]}
      >
        <Text style={styles.primaryButtonText}>{actionLabel}</Text>
      </Pressable>
      {phase !== "complete" && (
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to setup choices</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FAFAF7",
  },
  title: {
    color: "#172A24",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  mode: {
    color: "#52635D",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  phase: {
    color: "#236B52",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 18,
  },
  cloudRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D9E0DB",
  },
  cloudTitle: {
    color: "#172A24",
    fontWeight: "600",
  },
  cloudStatus: {
    color: "#52635D",
    flexShrink: 1,
    textAlign: "right",
  },
  modelList: {
    marginBottom: 18,
  },
  modelRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#D9E0DB",
  },
  modelHeading: {
    minHeight: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  modelName: {
    color: "#172A24",
    fontSize: 16,
    fontWeight: "600",
  },
  status: {
    color: "#52635D",
    fontSize: 13,
  },
  errorStatus: {
    color: "#A83E32",
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    overflow: "hidden",
    marginTop: 10,
    borderRadius: 4,
    backgroundColor: "#D9E0DB",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#25805D",
  },
  errorMessage: {
    color: "#8F3027",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 7,
  },
  message: {
    color: "#8F3027",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  completeNote: {
    color: "#236B52",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#236B52",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.82,
  },
  disabledButton: {
    opacity: 0.55,
  },
  backButton: {
    alignItems: "center",
    padding: 14,
  },
  backButtonText: {
    color: "#52635D",
    fontSize: 14,
  },
});