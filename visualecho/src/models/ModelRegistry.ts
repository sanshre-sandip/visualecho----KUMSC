import { createModelDefinition } from "./ModelDefinition";
import type { ModelDefinition, ModelType } from "./ModelDefinition";

export const REGISTERED_MODEL_DEFINITIONS: readonly ModelDefinition[] = [
  createModelDefinition({
    id: "gemma-local",
    name: "Gemma 4",
    type: "llm",
    description:
      "Local Gemma 4 language model used for word generation, speech evaluation, and drawing analysis.",
  }),
  createModelDefinition({
    id: "whisper-local",
    name: "Whisper",
    type: "stt",
    description:
      "Local Whisper model used for on-device speech-to-text transcription.",
    required: true,
  }),
  createModelDefinition({
    id: "tts-local",
    name: "Local TTS",
    type: "tts",
    description:
      "Local text-to-speech model (Kokoro or Piper) used for pronunciation playback.",
    required: true,
  }),
];

export class ModelRegistry {
  constructor(private readonly definitions: readonly ModelDefinition[]) {}

  getAvailableModels(): readonly ModelDefinition[] {
    return this.definitions;
  }

  getModelCount(): number {
    return this.definitions.length;
  }

  getModel(id: string): ModelDefinition | undefined {
    return this.definitions.find((definition) => definition.id === id);
  }

  hasModel(id: string): boolean {
    return this.getModel(id) !== undefined;
  }

  getModelsByType(type: ModelType): readonly ModelDefinition[] {
    return this.definitions.filter((definition) => definition.type === type);
  }
}

export const DEFAULT_MODEL_REGISTRY: ModelRegistry = new ModelRegistry(
  REGISTERED_MODEL_DEFINITIONS,
);