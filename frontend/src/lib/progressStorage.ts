import type { Level } from "./types";

export interface UserProgress {
  streak: number;
  sessionsCompleted: number;
  lastPracticeDate: string | null;
  level: Level;
  wordOfDayId: string | null;
  wordOfDayCompletedDate: string | null;
}

const STORAGE_KEY = "fluencyloop-progress";
const PROGRESS_EVENT = "fluencyloop-progress-updated";

const DEFAULT_PROGRESS: UserProgress = {
  streak: 0,
  sessionsCompleted: 0,
  lastPracticeDate: null,
  level: "everyday",
  wordOfDayId: null,
  wordOfDayCompletedDate: null,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function notifyProgressUpdated(): void {
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function getProgress(): UserProgress {
  if (typeof window === "undefined") return { ...DEFAULT_PROGRESS };

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULT_PROGRESS };

    const parsed = JSON.parse(saved) as Partial<UserProgress>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      streak: Number(parsed.streak) || 0,
      sessionsCompleted: Number(parsed.sessionsCompleted) || 0,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: UserProgress): UserProgress {
  if (typeof window === "undefined") return progress;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    notifyProgressUpdated();
  } catch {
    // Browser storage can be disabled or full; the app remains usable.
  }

  return progress;
}

export function recordSession(): UserProgress {
  const progress = getProgress();
  const currentDate = today();
  const nextStreak =
    progress.lastPracticeDate === currentDate
      ? progress.streak
      : progress.lastPracticeDate === yesterday()
        ? progress.streak + 1
        : 1;

  return saveProgress({
    ...progress,
    streak: nextStreak,
    sessionsCompleted:
      progress.lastPracticeDate === currentDate
        ? progress.sessionsCompleted
        : progress.sessionsCompleted + 1,
    lastPracticeDate: currentDate,
  });
}

export function markWordOfDayCompleted(wordId: string): UserProgress {
  const progress = getProgress();
  return saveProgress({
    ...progress,
    wordOfDayId: wordId,
    wordOfDayCompletedDate: today(),
  });
}

export function isWordOfDayCompleted(
  progress: UserProgress,
  wordId: string,
): boolean {
  return (
    progress.wordOfDayId === wordId &&
    progress.wordOfDayCompletedDate === today()
  );
}

export function subscribeToProgress(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleUpdate = () => listener();
  window.addEventListener(PROGRESS_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(PROGRESS_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}
