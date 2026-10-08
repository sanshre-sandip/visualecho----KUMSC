export interface PracticeAttempt {
  word: string;
  correct: boolean;
  completedAt: string;
}

export interface ProgressData {
  attempts: PracticeAttempt[];
  drawings: number;
}

const STORAGE_KEY = "visualecho.web.progress.v1";
const EMPTY_PROGRESS: ProgressData = { attempts: [], drawings: 0 };

function isProgressData(value: unknown): value is ProgressData {
  if (typeof value !== "object" || value === null || !("attempts" in value) || !Array.isArray(value.attempts) || !("drawings" in value) || typeof value.drawings !== "number") {
    return false;
  }
  return value.attempts.every(
    (attempt) =>
      typeof attempt === "object" &&
      attempt !== null &&
      "word" in attempt &&
      typeof attempt.word === "string" &&
      "correct" in attempt &&
      typeof attempt.correct === "boolean" &&
      "completedAt" in attempt &&
      typeof attempt.completedAt === "string",
  );
}

export function loadProgress(): ProgressData {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) return EMPTY_PROGRESS;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    throw new Error("Saved progress could not be read. Reset progress to start again.");
  }
  if (!isProgressData(parsed)) {
    throw new Error("Saved progress has an unexpected format. Reset progress to start again.");
  }
  return parsed;
}

export function saveProgress(progress: ProgressData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function clearProgress(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
