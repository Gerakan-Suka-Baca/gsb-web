import { optionalUserProcedure } from "@/trpc/init";
import z from "zod";
import type { TryoutAttempt } from "../../types";

export const getAttempt = optionalUserProcedure
  .input(z.object({ tryoutId: z.string() }))
  .query(async ({ ctx, input }) => {
    if (!ctx.session) return null;
    const { db: payload } = ctx;
    const session = ctx.session!;
    const attempts = await payload.find({
      collection: "tryout-attempts",
      where: {
        and: [
          { user: { equals: session.user.id } },
          { tryout: { equals: input.tryoutId } },
        ],
      },
      limit: 1,
      sort: "-createdAt",
      depth: 0,
    });
    return (attempts.docs.length === 0
      ? null
      : attempts.docs[0]) as unknown as TryoutAttempt | null;
  });

export const getMyAttempts = optionalUserProcedure.query(async ({ ctx }) => {
  if (!ctx.session) return [];
  const { db: payload } = ctx;
  const session = ctx.session!;
  const attempts = await payload.find({
    collection: "tryout-attempts",
    where: { user: { equals: session.user.id } },
    depth: 1,
    pagination: false,
    sort: "-createdAt",
  });
  return attempts.docs as unknown as TryoutAttempt[];
});
