import { Directory, File, Paths } from "expo-file-system";
import { ModelManager } from "./ModelManager";
import type { ModelDefinition, ModelChecksum } from "./ModelDefinition";
import type { ModelStatus, ModelStatusResolver } from "./ModelStatus";
import { createIdleModelStatus } from "./ModelStatus";
import { DEFAULT_MODEL_REGISTRY, ModelRegistry } from "./ModelRegistry";

/** Logical top-level name for local model content. */
export const MODEL_DIRECTORY_NAME = "models";
const INSTALLED_METADATA_FILENAME = "installed.json";
const LEGACY_METADATA_KEY_PREFIX = "model_metadata";

/** Platform-independent relative directory for a single model. */
export function getModelRelativeDirectory(modelId: string): string {
  return `${MODEL_DIRECTORY_NAME}/${modelId}`;
}

export function getInstalledModelMetadataKey(modelId: string): string {
  return `${LEGACY_METADATA_KEY_PREFIX}:${modelId}`;
}

export interface InstalledModelFile {
  path: string;
  sizeBytes: number;
  checksum?: ModelChecksum | null;
}

export interface InstalledModelMetadata {
  modelId: string;
  version: string;
  installedAt: string;
  sizeBytes: number;
  format: string | null;
  runtime: string | null;
  platform: ModelDefinition["platform"];
  sourceUrl: string | null;
  files: readonly InstalledModelFile[];
}

/** Storage contract; UI components never receive filesystem paths. */
export interface ModelStorage {
  getModelDirectory(modelId: string): Promise<string>;
  hasModelDirectory(modelId: string): Promise<boolean>;
  isModelInstalled(definition: ModelDefinition): Promise<boolean>;
  getInstalledModelMetadata(modelId: string): Promise<InstalledModelMetadata | null>;
  verifyInstalledModel(
    definition: ModelDefinition,
    metadata: InstalledModelMetadata,
  ): Promise<boolean>;
  saveInstalledModelMetadata(
    definition: ModelDefinition,
    metadata: InstalledModelMetadata,
  ): Promise<void>;
  removeModel(modelId: string): Promise<void>;
  getAvailableStorageBytes(): Promise<number | null>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChecksum(value: unknown): value is ModelChecksum {
  if (!isRecord(value)) {
    return false;
  }
  return (
    (value.algorithm === "md5" || value.algorithm === "sha256") &&
    typeof value.value === "string" &&
    value.value.length > 0
  );
}

function isInstalledMetadata(value: unknown): value is InstalledModelMetadata {
  if (!isRecord(value) || !Array.isArray(value.files)) {
    return false;
  }
  return (
    typeof value.modelId === "string" &&
    typeof value.version === "string" &&
    typeof value.installedAt === "string" &&
    typeof value.sizeBytes === "number" &&
    (typeof value.format === "string" || value.format === null) &&
    (typeof value.runtime === "string" || value.runtime === null) &&
    (value.platform === "android" || value.platform === "ios" || value.platform === "all") &&
    (typeof value.sourceUrl === "string" || value.sourceUrl === null) &&
    value.files.every((file: unknown) => {
      if (!isRecord(file)) {
        return false;
      }
      return (
        typeof file.path === "string" &&
        typeof file.sizeBytes === "number" &&
        (file.checksum === undefined || file.checksum === null || isChecksum(file.checksum))
      );
    })
  );
}

function safeModelId(modelId: string): string {
  if (!/^[a-z0-9-]+$/.test(modelId)) {
    throw new Error("Invalid model identifier.");
  }
  return modelId;
}

function modelDirectory(modelId: string): Directory {
  return new Directory(Paths.document, MODEL_DIRECTORY_NAME, safeModelId(modelId));
}

function modelFile(directory: Directory, relativePath: string): File | null {
  const segments = relativePath.split("/");
  if (
    segments.length === 0 ||
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    return null;
  }
  return new File(directory, ...segments);
}

function checksumsMatch(left: ModelChecksum, right: ModelChecksum | null | undefined): boolean {
  return Boolean(
    right &&
      left.algorithm === right.algorithm &&
      left.value.toLowerCase() === right.value.toLowerCase(),
  );
}

/** Expo document storage keeps model files in the app's persistent private area. */
export class ExpoFileSystemModelStorage implements ModelStorage {
  async getModelDirectory(modelId: string): Promise<string> {
    return modelDirectory(modelId).uri;
  }

  async hasModelDirectory(modelId: string): Promise<boolean> {
    return modelDirectory(modelId).exists;
  }

  async isModelInstalled(definition: ModelDefinition): Promise<boolean> {
    const metadata = await this.getInstalledModelMetadata(definition.id);
    return metadata ? this.verifyInstalledModel(definition, metadata) : false;
  }

  async getInstalledModelMetadata(modelId: string): Promise<InstalledModelMetadata | null> {
    try {
      const directory = modelDirectory(modelId);
      if (!directory.exists) {
        return null;
      }
      const manifest = new File(directory, INSTALLED_METADATA_FILENAME);
      if (!manifest.exists) {
        return null;
      }
      const parsed: unknown = JSON.parse(await manifest.text());
      return isInstalledMetadata(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  async verifyInstalledModel(
    definition: ModelDefinition,
    metadata: InstalledModelMetadata,
  ): Promise<boolean> {
    if (
      metadata.modelId !== definition.id ||
      definition.version === null ||
      metadata.version !== definition.version ||
      definition.expectedFiles === null ||
      definition.expectedFiles.length === 0 ||
      metadata.format !== definition.format ||
      metadata.runtime !== definition.runtime ||
      metadata.platform !== definition.platform ||
      metadata.files.length !== definition.expectedFiles.length
    ) {
      return false;
    }

    const expectedFiles = new Set(definition.expectedFiles);
    const directory = modelDirectory(definition.id);
    let actualSizeBytes = 0;
    for (const installedFile of metadata.files) {
      if (!expectedFiles.delete(installedFile.path) || installedFile.sizeBytes <= 0) {
        return false;
      }
      const file = modelFile(directory, installedFile.path);
      if (!file?.exists || file.size !== installedFile.sizeBytes) {
        return false;
      }
      if (installedFile.checksum) {
        if (installedFile.checksum.algorithm !== "md5") {
          return false;
        }
        if (file.md5?.toLowerCase() !== installedFile.checksum.value.toLowerCase()) {
          return false;
        }
      }
      actualSizeBytes += file.size;
    }

    if (expectedFiles.size !== 0 || metadata.sizeBytes !== actualSizeBytes) {
      return false;
    }

    if (definition.checksum) {
      if (
        metadata.files.length !== 1 ||
        !checksumsMatch(definition.checksum, metadata.files[0].checksum)
      ) {
        return false;
      }
    }
    return true;
  }

  async saveInstalledModelMetadata(
    definition: ModelDefinition,
    metadata: InstalledModelMetadata,
  ): Promise<void> {
    if (!(await this.verifyInstalledModel(definition, metadata))) {
      throw new Error("Model files did not pass installation verification.");
    }

    const directory = modelDirectory(definition.id);
    directory.create({ idempotent: true, intermediates: true });
    new File(directory, INSTALLED_METADATA_FILENAME).write(JSON.stringify(metadata));
  }

  async removeModel(modelId: string): Promise<void> {
    const directory = modelDirectory(modelId);
    if (directory.exists) {
      directory.delete();
    }
  }

  async getAvailableStorageBytes(): Promise<number | null> {
    try {
      const availableBytes = Paths.availableDiskSpace;
      return Number.isFinite(availableBytes) && availableBytes >= 0 ? availableBytes : null;
    } catch {
      return null;
    }
  }
}

export function createModelStorage(): ModelStorage {
  return new ExpoFileSystemModelStorage();
}

/** Status resolver trusts only a manifest whose artifacts pass verification. */
export class StorageBackedStatusResolver implements ModelStatusResolver {
  constructor(private readonly storage: ModelStorage) {}

  async getModelStatus(definition: ModelDefinition): Promise<ModelStatus> {
    const metadata = await this.storage.getInstalledModelMetadata(definition.id);
    if (!metadata) {
      if (await this.storage.hasModelDirectory(definition.id)) {
        return {
          modelId: definition.id,
          state: "error",
          progress: null,
          error: "Model files are incomplete or missing valid installation metadata.",
          errorCode: "verification",
          installedVersion: null,
        };
      }
      return createIdleModelStatus(definition);
    }

    if (!(await this.storage.verifyInstalledModel(definition, metadata))) {
      return {
        modelId: definition.id,
        state: "error",
        progress: null,
        error: "Model files failed version or integrity verification.",
        errorCode: "verification",
        installedVersion: metadata.version,
      };
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
    storageCapacity: storage,
  });
}