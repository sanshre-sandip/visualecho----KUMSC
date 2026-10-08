import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "visualecho_demo_progress_v1";

export interface DemoAttempt {
  id: string;
  targetWord: string;
  transcript: string;
  correct: boolean;
  aiMode: "local" | "cloud";
  completedAt: string;
}

export interface DemoProgress {
  attempts: DemoAttempt[];
  drawingsSaved: number;
}

const EMPTY_PROGRESS: DemoProgress = { attempts: [], drawingsSaved: 0 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDemoAttempt(value: unknown): value is DemoAttempt {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.targetWord === "string" &&
    typeof value.transcript === "string" &&
    typeof value.correct === "boolean" &&
    (value.aiMode === "local" || value.aiMode === "cloud") &&
    typeof value.completedAt === "string"
  );
}

function parseProgress(value: unknown): DemoProgress {
  if (!isRecord(value)) return { ...EMPTY_PROGRESS };
  const attempts = Array.isArray(value.attempts)
    ? value.attempts.filter(isDemoAttempt)
    : [];
  const drawingsSaved =
    typeof value.drawingsSaved === "number" && Number.isInteger(value.drawingsSaved)
      ? Math.max(0, value.drawingsSaved)
      : 0;
  return { attempts, drawingsSaved };
}

export async function loadDemoProgress(): Promise<DemoProgress> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return { ...EMPTY_PROGRESS };
  try {
    return parseProgress(JSON.parse(stored) as unknown);
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

async function saveDemoProgress(progress: DemoProgress): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export async function appendDemoAttempt(attempt: DemoAttempt): Promise<DemoProgress> {
  const current = await loadDemoProgress();
  const next = { ...current, attempts: [...current.attempts, attempt] };
  await saveDemoProgress(next);
  return next;
}

export async function addDemoDrawing(): Promise<DemoProgress> {
  const current = await loadDemoProgress();
  const next = { ...current, drawingsSaved: current.drawingsSaved + 1 };
  await saveDemoProgress(next);
  return next;
}

export async function clearDemoProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}