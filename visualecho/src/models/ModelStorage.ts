import AsyncStorage from "@react-native-async-storage/async-storage";
import { ModelManager } from "./ModelManager";
import { DEFAULT_MODEL_REGISTRY, ModelRegistry } from "./ModelRegistry";
import type { ModelDefinition } from "./ModelDefinition";
import type { ModelStatus, ModelStatusResolver } from "./ModelStatus";
import { createIdleModelStatus } from "./ModelStatus";

/** Logical top-level name for local model content. Never a hardcoded OS path. */
export const MODEL_DIRECTORY_NAME = "models";

/** Platform-independent relative directory for a single model. */
export function getModelRelativeDirectory(modelId: string): string {
  return `${MODEL_DIRECTORY_NAME}/${modelId}`;
}

export interface InstalledModelMetadata {
  modelId: string;
  version: string;
  installedAt: string;
  sizeBytes?: number;
  runtime?: string | null;
}

/**
 * Abstraction over where model files live. A future filesystem-based
 * implementation will resolve model directories, check file existence, and
 * report available storage on the platform. Nothing here downloads content.
 */
export interface ModelStorage {
  getModelDirectory(modelId: string): Promise<string>;
  isModelInstalled(modelId: string): Promise<boolean>;
  getInstalledModelMetadata(modelId: string): Promise<InstalledModelMetadata | null>;
  saveInstalledModelMetadata(metadata: InstalledModelMetadata): Promise<void>;
  removeInstalledModelMetadata(modelId: string): Promise<void>;
  /** Available bytes for model downloads, or null when unknown/unimplemented. */
  getAvailableStorageBytes(): Promise<number | null>;
}

const INSTALLED_METADATA_KEY_PREFIX = "model_metadata";

export function getInstalledModelMetadataKey(modelId: string): string {
  return `${INSTALLED_METADATA_KEY_PREFIX}:${modelId}`;
}

/**
 * Foundational storage placeholder. Tracks installed-model metadata only
 * (no model content, no downloads). Swap with a filesystem-backed
 * implementation later without touching callers.
 */
export class AsyncStorageModelStorage implements ModelStorage {
  async getModelDirectory(modelId: string): Promise<string> {
    return getModelRelativeDirectory(modelId);
  }

  async isModelInstalled(modelId: string): Promise<boolean> {
    return (await this.getInstalledModelMetadata(modelId)) !== null;
  }

  async getInstalledModelMetadata(modelId: string): Promise<InstalledModelMetadata | null> {
    try {
      const raw = await AsyncStorage.getItem(getInstalledModelMetadataKey(modelId));
      return raw ? (JSON.parse(raw) as InstalledModelMetadata) : null;
    } catch (error) {
      console.warn(`Failed to read installed metadata for model "${modelId}"`, error);
      return null;
    }
  }

  async saveInstalledModelMetadata(metadata: InstalledModelMetadata): Promise<void> {
    try {
      await AsyncStorage.setItem(
        getInstalledModelMetadataKey(metadata.modelId),
        JSON.stringify(metadata),
      );
    } catch (error) {
      console.warn(
        `Failed to save installed metadata for model "${metadata.modelId}"`,
        error,
      );
    }
  }

  async removeInstalledModelMetadata(modelId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(getInstalledModelMetadataKey(modelId));
    } catch (error) {
      console.warn(`Failed to remove installed metadata for model "${modelId}"`, error);
    }
  }

  async getAvailableStorageBytes(): Promise<number | null> {
    // Requires a native filesystem/storage API; not implemented yet.
    return null;
  }
}

export function createModelStorage(): ModelStorage {
  return new AsyncStorageModelStorage();
}

/** Status resolver backed by ModelStorage metadata. */
export class StorageBackedStatusResolver implements ModelStatusResolver {
  constructor(private readonly storage: ModelStorage) {}

  async getModelStatus(definition: ModelDefinition): Promise<ModelStatus> {
    const metadata = await this.storage.getInstalledModelMetadata(definition.id);
    if (!metadata) {
      return createIdleModelStatus(definition);
    }
    return {
      modelId: definition.id,
      state: "installed",
      progress: null,
      error: null,
      errorCode: null,
      installedVersion: metadata.version,
    };
  }
}

export function createStorageBackedModelManager(
  storage: ModelStorage = createModelStorage(),
  registry: ModelRegistry = DEFAULT_MODEL_REGISTRY,
): ModelManager {
  return new ModelManager({
    registry,
    statusResolver: new StorageBackedStatusResolver(storage),
  });
}