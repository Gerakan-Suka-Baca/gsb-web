import z from "zod";

export const eventSchema = z.object({
  id: z.string(),
  kind: z.enum(["answer", "flag"]),
  subtestId: z.string(),
  questionId: z.string(),
  answerId: z.string().optional(),
  flag: z.boolean().optional(),
  revision: z.number(),
  clientTs: z.number(),
});

export const saveProgressInputSchema = z.object({
  attemptId: z.string(),
  answers: z.record(z.string(), z.record(z.string(), z.string())),
  flags: z.record(z.string(), z.record(z.string(), z.boolean())),
  currentSubtest: z.number().optional(),
  examState: z.enum(["running", "bridging"]).optional(),
  bridgingExpiry: z.string().optional(),
  currentQuestionIndex: z.number().optional(),
});

export const saveProgressBatchInputSchema = z.object({
  attemptId: z.string(),
  batchId: z.string(),
  clientTime: z.number(),
  events: z.array(eventSchema),
  currentSubtest: z.number().optional(),
  examState: z.enum(["running", "bridging"]).optional(),
  currentQuestionIndex: z.number().optional(),
});
