import localforage from "localforage";

type AnswerMap = Record<string, string>;
type FlagMap = Record<string, boolean>;

export interface TryoutBackup {
  answers: Record<string, AnswerMap>;
  flags: Record<string, FlagMap>;
  currentSubtest: number;
  currentQuestionIndex: number;
  secondsRemaining: number;
  examState: "loading" | "ready" | "running" | "bridging" | "finished";
  updatedAt: number;
  version: number; 
}

const store = localforage.createInstance({
  name: "gsb-tryout",
  storeName: "backup_v2", 
});

function key(attemptId: string) {
  return `backup-${attemptId}`;
}

export async function saveBackup(
  attemptId: string,
  data: Omit<TryoutBackup, "updatedAt" | "version">
) {
  const payload: TryoutBackup = {
    ...data,
    updatedAt: Date.now(),
    version: 1,
  };
  await store.setItem(key(attemptId), payload);
}

export async function loadBackup(attemptId: string): Promise<TryoutBackup | null> {
  const data = await store.getItem<TryoutBackup>(key(attemptId));
  if (!data) return null;
  
  // Basic integrity check
  if (typeof data.currentSubtest !== 'number') return null;
  
  return data;
}

export async function clearBackup(attemptId: string) {
  await store.removeItem(key(attemptId));
}
