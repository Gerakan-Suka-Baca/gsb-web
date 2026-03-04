import { TRPCError } from "@trpc/server";

import type { Tryout } from "@/payload-types";

export const SUBTEST_QUERY_LIMIT = 1000;
export const HEARTBEAT_GRACE_MS = 5 * 60 * 1000;

export type TryoutWindowDoc = Pick<Tryout, "id" | "dateOpen" | "dateClose">;

export const parseDateMs = (value: unknown): number | null => {
  if (value instanceof Date) return value.getTime();
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export type PayloadLike = {
  findByID: (args: { collection: string; id: string; depth: number }) => Promise<unknown>;
  find: (args: {
    collection: string;
    where: unknown;
    limit: number;
    sort: string;
    depth: number;
    select?: unknown;
  }) => Promise<{ docs?: unknown[] }>;
};

export const getTryoutWindow = async (
  payload: PayloadLike,
  tryoutId: string
): Promise<TryoutWindowDoc> => {
  return (await payload.findByID({
    collection: "tryouts",
    id: tryoutId,
    depth: 0,
  })) as unknown as TryoutWindowDoc;
};

export const assertTryoutWindowOpen = (
  tryout: TryoutWindowDoc,
  action: string,
  now: Date
) => {
  const openMs = parseDateMs(tryout.dateOpen);
  const closeMs = parseDateMs(tryout.dateClose);
  if (openMs === null || closeMs === null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Tryout schedule is invalid",
    });
  }

  const nowMs = now.getTime();
  if (nowMs < openMs) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Tryout belum dibuka. Tidak bisa ${action}.`,
    });
  }
  if (nowMs > closeMs) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Tryout sudah ditutup. Tidak bisa ${action}.`,
    });
  }
};
