import type { AppConfiguration } from "@/config/model";
import type { ModelDefinition } from "./ModelDefinition";
import { createIdleModelStatus } from "./ModelStatus";
import type {
  ModelInstallErrorCode,
  ModelStatus,
  ModelStatusResolver,
} from "./ModelStatus";
import { DEFAULT_MODEL_REGISTRY, ModelRegistry } from "./ModelRegistry";

export type ModelRequirementsInput = Pick<AppConfiguration, "aiMode">;

export type ModelSetupPhase =
  | "preparing"
  | "checking_device"
  | "checking_models"
  | "installing_models"
  | "verifying_installation";

export interface ModelInstallContext {
  signal?: AbortSignal;
  onProgress: (progress: number) => void;
}

export interface ModelInstallProvider {
  installModel(
    definition: ModelDefinition,
    context: ModelInstallContext,
  ): Promise<void>;
}

export interface ModelInstallObserver {
  onPhase?: (phase: ModelSetupPhase) => void;
  onStatus?: (status: ModelStatus) => void;
}

export interface ModelStorageCapacity {
  getAvailableStorageBytes(): Promise<number | null>;
}

export class ModelInstallError extends Error {
  constructor(
    readonly code: ModelInstallErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ModelInstallError";
  }
}

/** No model source/runtime has been approved for Android yet. */
export class UnconfiguredModelInstallProvider implements ModelInstallProvider {
  async installModel(definition: ModelDefinition): Promise<void> {
    throw new ModelInstallError(
      "source_unavailable",
      `${definition.name} cannot be installed yet because its verified Android model source and runtime have not been selected. No files were downloaded.`,
    );
  }
}

export interface ModelManagerOptions {
  registry?: ModelRegistry;
  statusResolver?: ModelStatusResolver;
  installProvider?: ModelInstallProvider;
  storageCapacity?: ModelStorageCapacity;
}

/** Baseline resolver that only reflects the definition's registered state. */
class StaticStatusResolver implements ModelStatusResolver {
  async getModelStatus(definition: ModelDefinition): Promise<ModelStatus> {
    return createIdleModelStatus(definition);
  }
}

export class ModelManager {
  private readonly registry: ModelRegistry;
  private readonly statusResolver: ModelStatusResolver;
  private readonly installProvider: ModelInstallProvider;
  private readonly storageCapacity?: ModelStorageCapacity;
  private readonly liveStatuses = new Map<string, ModelStatus>();

  constructor(options: ModelManagerOptions = {}) {
    this.registry = options.registry ?? DEFAULT_MODEL_REGISTRY;
    this.statusResolver = options.statusResolver ?? new StaticStatusResolver();
    this.installProvider = options.installProvider ?? new UnconfiguredModelInstallProvider();
    this.storageCapacity = options.storageCapacity;
  }

  /** All models the application can install. */
  async getAvailableModels(): Promise<ModelDefinition[]> {
    return [...this.registry.getAvailableModels()];
  }

  /** A single model definition, or null when the id is unknown. */
  async getModel(id: string): Promise<ModelDefinition | null> {
    return this.registry.getModel(id) ?? null;
  }

  async isModelInstalled(id: string): Promise<boolean> {
    const status = await this.getModelStatus(id);
    return status?.state === "installed";
  }

  /** Live status for a model, or null when the id is unknown. */
  async getModelStatus(id: string): Promise<ModelStatus | null> {
    const definition = this.registry.getModel(id);
    if (!definition) {
      return null;
    }
    const persistedStatus = await this.statusResolver.getModelStatus(definition);
    if (persistedStatus.state === "installed") {
      this.liveStatuses.set(id, persistedStatus);
      return persistedStatus;
    }
    return this.liveStatuses.get(id) ?? persistedStatus;
  }

  /** Live status for every registered model. */
  async getModelStatuses(): Promise<ModelStatus[]> {
    const statuses: ModelStatus[] = [];
    for (const definition of this.registry.getAvailableModels()) {
      statuses.push(await this.statusResolver.getModelStatus(definition));
    }
    return statuses;
  }

  /**
   * Models required by the given configuration.
   * Local AI requires Gemma; Whisper and TTS are always required because STT
   * and TTS are always local.
   */
  async getRequiredModels(config: ModelRequirementsInput): Promise<ModelDefinition[]> {
    const usesLocalAi = config.aiMode === "local";
    return this.registry
      .getAvailableModels()
      .filter(
        (definition) => definition.required || (usesLocalAi && definition.type === "llm"),
      );
  }

  /** Required models that are not currently installed. */
  async getMissingModels(config: ModelRequirementsInput): Promise<ModelDefinition[]> {
    const required = await this.getRequiredModels(config);
    const missing: ModelDefinition[] = [];
    for (const definition of required) {
      if (!(await this.isModelInstalled(definition.id))) {
        missing.push(definition);
      }
    }
    return missing;
  }

  /** Total exact storage required, or null when any selected size is unknown. */
  async getRequiredStorageBytes(config: ModelRequirementsInput): Promise<number | null> {
    const missing = await this.getMissingModels(config);
    if (missing.some((definition) => definition.requiredStorageBytes === null)) {
      return null;
    }
    return missing.reduce(
      (total, definition) => total + (definition.requiredStorageBytes ?? 0),
      0,
    );
  }

  /** Installs missing models sequentially and only reports success after status re-check. */
  async installRequiredModels(
    config: ModelRequirementsInput,
    observer: ModelInstallObserver = {},
    signal?: AbortSignal,
  ): Promise<ModelStatus[]> {
    const required = await this.getRequiredModels(config);
    observer.onPhase?.("checking_device");
    const availableBytes =
      (await this.storageCapacity?.getAvailableStorageBytes().catch(() => null)) ?? null;

    observer.onPhase?.("checking_models");
    const missing: ModelDefinition[] = [];
    for (const definition of required) {
      this.publishStatus(
        { ...createIdleModelStatus(definition), state: "checking" },
        observer,
      );
      const status = await this.statusResolver.getModelStatus(definition);
      this.publishStatus(status, observer);
      if (status.state !== "installed") {
        missing.push(definition);
      }
    }

    if (missing.length === 0) {
      return required.map((definition) => this.liveStatuses.get(definition.id)!);
    }

    const requiredBytes = missing.every(
      (definition) => definition.requiredStorageBytes !== null,
    )
      ? missing.reduce(
          (total, definition) => total + (definition.requiredStorageBytes ?? 0),
          0,
        )
      : null;

    if (availableBytes !== null && requiredBytes !== null && availableBytes < requiredBytes) {
      const requiredGb = (requiredBytes / 1024 ** 3).toFixed(1);
      const message = `Not enough storage. VisualEcho needs approximately ${requiredGb} GB for the selected local models.`;
      for (const definition of missing) {
        this.publishStatus(
          this.errorStatus(definition, "insufficient_storage", message),
          observer,
        );
      }
      return required.map((definition) => this.liveStatuses.get(definition.id)!);
    }

    observer.onPhase?.("installing_models");
    for (const definition of missing) {
      if (signal?.aborted) {
        this.publishStatus(
          this.errorStatus(
            definition,
            "interrupted",
            "Model setup was cancelled before installation completed.",
          ),
          observer,
        );
        continue;
      }

      this.publishStatus(
        { ...createIdleModelStatus(definition), state: "queued" },
        observer,
      );
      try {
        await this.installProvider.installModel(definition, {
          signal,
          onProgress: (progress) => {
            if (!Number.isFinite(progress)) {
              return;
            }
            this.publishStatus(
              {
                modelId: definition.id,
                state: "downloading",
                progress: Math.max(0, Math.min(1, progress)),
                error: null,
                errorCode: null,
                installedVersion: null,
              },
              observer,
            );
          },
        });

        observer.onPhase?.("verifying_installation");
        this.publishStatus(
          { ...createIdleModelStatus(definition), state: "verifying" },
          observer,
        );
        const verifiedStatus = await this.statusResolver.getModelStatus(definition);
        if (verifiedStatus.state !== "installed") {
          throw new ModelInstallError(
            "verification",
            `${definition.name} did not pass installation verification.`,
          );
        }
        this.publishStatus(verifiedStatus, observer);
      } catch (error) {
        const installError =
          error instanceof ModelInstallError
            ? error
            : new ModelInstallError(
                "unknown",
                `${definition.name} could not be installed. Please retry.`,
              );
        this.publishStatus(
          this.errorStatus(definition, installError.code, installError.message),
          observer,
        );
      }
    }

    return required.map((definition) => this.liveStatuses.get(definition.id)!);
  }

  private errorStatus(
    definition: ModelDefinition,
    errorCode: ModelInstallErrorCode,
    error: string,
  ): ModelStatus {
    return {
      modelId: definition.id,
      state: "error",
      progress: null,
      error,
      errorCode,
      installedVersion: null,
    };
  }

  private publishStatus(status: ModelStatus, observer: ModelInstallObserver): void {
    this.liveStatuses.set(status.modelId, status);
    observer.onStatus?.(status);
  }
}

export const modelManager = new ModelManager();