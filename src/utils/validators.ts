import { z } from "zod";

export const dateParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Expected YYYY-MM-DD format");

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
  meta: z.record(z.any()).optional(),
  isLocked: z.boolean().optional(),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;

export const requestUnwrapSchema = z.object({
  user_id: z.string().uuid(),
  entry_id: z.string().uuid(),
  reason: z.string().min(5),
});

export type RequestUnwrapInput = z.infer<typeof requestUnwrapSchema>;
