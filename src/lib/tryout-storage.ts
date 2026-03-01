import localforage from "localforage";

type AnswerMap = Record<string, string>;
type FlagMap = Record<string, boolean>;

export type TryoutEventKind = "answer" | "flag";

export interface TryoutEvent {
  id: string;
  attemptId: string;
  kind: TryoutEventKind;
  subtestId: string;
  questionId: string;
  answerId?: string;
  flag?: boolean;
  revision: number;
  clientTs: number;
  sent?: boolean;
  failedCount?: number;
}

export interface TryoutBackup {
  answers: Record<string, AnswerMap>;
  flags: Record<string, FlagMap>;
  currentSubtest: number;
  currentQuestionIndex: number;
  secondsRemaining: number;
  examState: "loading" | "ready" | "running" | "bridging" | "finished";
  subtestDurations: Record<string, number>;
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

function eventsKey(attemptId: string) {
  return `events-${attemptId}`;
}

export async function saveBackup(
  attemptId: string,
  data: Omit<TryoutBackup, "updatedAt" | "version">
) {
  const payload: TryoutBackup = {
    ...data,
    updatedAt: Date.now(),
    version: 2,
  };
  await store.setItem(key(attemptId), payload);
}

export async function loadBackup(attemptId: string): Promise<TryoutBackup | null> {
  const data = await store.getItem<TryoutBackup>(key(attemptId));
  if (!data) return null;
  
  if (data.version !== 2) return null;
  if (typeof data.currentSubtest !== "number") return null;
  if (typeof data.updatedAt !== "number") return null;
  
  return data;
}

export async function clearBackup(attemptId: string) {
  await store.removeItem(key(attemptId));
}

async function readEvents(attemptId: string): Promise<TryoutEvent[]> {
  const data = await store.getItem<TryoutEvent[]>(eventsKey(attemptId));
  return Array.isArray(data) ? data : [];
}

export async function appendEvent(attemptId: string, event: TryoutEvent) {
  const events = await readEvents(attemptId);
  const next = [...events, event].slice(-1000);
  await store.setItem(eventsKey(attemptId), next);
}

export async function getPendingEvents(attemptId: string, limit?: number): Promise<TryoutEvent[]> {
  const events = await readEvents(attemptId);
  const pending = events.filter((e) => !e.sent);
  pending.sort((a, b) => a.clientTs - b.clientTs || a.revision - b.revision);
  return typeof limit === "number" ? pending.slice(0, limit) : pending;
}

export async function markEventsSent(attemptId: string, eventIds: string[]) {
  if (eventIds.length === 0) return;
  const events = await readEvents(attemptId);
  const idSet = new Set(eventIds);
  const next = events.map((e) => (idSet.has(e.id) ? { ...e, sent: true } : e));
  await store.setItem(eventsKey(attemptId), next);
}

export async function markEventsFailed(attemptId: string, eventIds: string[]) {
  if (eventIds.length === 0) return;
  const events = await readEvents(attemptId);
  const idSet = new Set(eventIds);
  const next = events.map((e) => {
    if (!idSet.has(e.id)) return e;
    return { ...e, failedCount: (e.failedCount ?? 0) + 1 };
  });
  await store.setItem(eventsKey(attemptId), next);
}

export async function clearEvents(attemptId: string) {
  await store.removeItem(eventsKey(attemptId));
}
