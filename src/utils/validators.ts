import { z } from "zod";

import type { Json } from "../types/db";

export const dateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Expected YYYY-MM-DD format");

const jsonValueSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);

export const createEntrySchema = z.object({
  entryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "Expected YYYY-MM-DD format"),
  entryTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/u, "Expected HH:MM or HH:MM:SS")
    .optional(),
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
  wrappedEntryKey: z.string().min(1),
  meta: jsonValueSchema.optional(),
  isLocked: z.boolean().optional(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;

export const requestUnwrapSchema = z.object({
  user_id: z.string().uuid(),
  entry_id: z.string().uuid(),
  reason: z.string().min(5),
});

export type RequestUnwrapInput = z.infer<typeof requestUnwrapSchema>;

export const adminStatusSchema = z
  .object({
    reason: z.string().min(2).optional(),
  })
  .default({});

export type AdminStatusInput = z.infer<typeof adminStatusSchema>;
