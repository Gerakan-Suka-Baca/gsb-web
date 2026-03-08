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

const sanitizeAnswers = (value: unknown): Record<string, AnswerMap> => {
  if (!value || typeof value !== "object") return {};
  const output: Record<string, AnswerMap> = {};
  for (const [subtestId, answerMap] of Object.entries(value as Record<string, unknown>)) {
    if (typeof subtestId !== "string" || !answerMap || typeof answerMap !== "object") continue;
    const clean: AnswerMap = {};
    for (const [questionId, answerId] of Object.entries(answerMap as Record<string, unknown>)) {
      if (typeof questionId === "string" && typeof answerId === "string") {
        clean[questionId] = answerId;
      }
    }
    output[subtestId] = clean;
  }
  return output;
};

const sanitizeFlags = (value: unknown): Record<string, FlagMap> => {
  if (!value || typeof value !== "object") return {};
  const output: Record<string, FlagMap> = {};
  for (const [subtestId, flagMap] of Object.entries(value as Record<string, unknown>)) {
    if (typeof subtestId !== "string" || !flagMap || typeof flagMap !== "object") continue;
    const clean: FlagMap = {};
    for (const [questionId, flag] of Object.entries(flagMap as Record<string, unknown>)) {
      if (typeof questionId === "string" && typeof flag === "boolean") {
        clean[questionId] = flag;
      }
    }
    output[subtestId] = clean;
  }
  return output;
};

const sanitizeEvent = (event: unknown): TryoutEvent | null => {
  if (!event || typeof event !== "object") return null;
  const raw = event as Record<string, unknown>;
  if (raw.kind !== "answer" && raw.kind !== "flag") return null;
  if (typeof raw.id !== "string" || typeof raw.attemptId !== "string") return null;
  if (typeof raw.subtestId !== "string" || typeof raw.questionId !== "string") return null;
  if (typeof raw.revision !== "number" || typeof raw.clientTs !== "number") return null;
  const base: TryoutEvent = {
    id: raw.id,
    attemptId: raw.attemptId,
    kind: raw.kind,
    subtestId: raw.subtestId,
    questionId: raw.questionId,
    revision: raw.revision,
    clientTs: raw.clientTs,
    sent: typeof raw.sent === "boolean" ? raw.sent : undefined,
    failedCount: typeof raw.failedCount === "number" ? raw.failedCount : undefined,
  };
  if (raw.kind === "answer") {
    if (typeof raw.answerId !== "string") return null;
    base.answerId = raw.answerId;
    return base;
  }
  if (typeof raw.flag !== "boolean") return null;
  base.flag = raw.flag;
  return base;
};

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
    answers: sanitizeAnswers(data.answers),
    flags: sanitizeFlags(data.flags),
    currentSubtest: Number.isFinite(data.currentSubtest) ? data.currentSubtest : 0,
    currentQuestionIndex: Number.isFinite(data.currentQuestionIndex) ? data.currentQuestionIndex : 0,
    secondsRemaining: Number.isFinite(data.secondsRemaining) ? data.secondsRemaining : 0,
    examState: data.examState,
    subtestDurations: data.subtestDurations ?? {},
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
  if (!Array.isArray(data)) return [];
  const sanitized = data
    .map((event) => sanitizeEvent(event))
    .filter((event): event is TryoutEvent => Boolean(event));
  if (sanitized.length !== data.length) {
    await store.setItem(eventsKey(attemptId), sanitized);
  }
  return sanitized;
}

export async function appendEvent(attemptId: string, event: TryoutEvent) {
  const sanitized = sanitizeEvent(event);
  if (!sanitized) return;
  const events = await readEvents(attemptId);
  const next = [...events, sanitized].slice(-1000);
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
