import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import type { AppEnv } from "../types/context";
import { createEntrySchema, dateParamSchema } from "../utils/validators";

export const createEntryHandler = async (c: Context<AppEnv>) => {
  const supabaseClient = c.get("supabaseClient");
  const user = c.get("supabaseUser");

  const payload = await c.req.json();
  const parsed = createEntrySchema.safeParse(payload);

  if (!parsed.success) {
    throw new HTTPException(400, {
      message: parsed.error.flatten().formErrors.join(", "),
    });
  }

  const {
    entryDate,
    entryTime,
    ciphertext,
    iv,
    wrappedEntryKey,
    meta,
    isLocked,
  } = parsed.data;

  const { data, error } = await supabaseClient
    .from("entries")
    .insert({
      user_id: user.id,
      entry_date: entryDate,
      entry_time: entryTime ?? null,
      ciphertext,
      iv,
      wrapped_entry_key: wrappedEntryKey,
      meta: meta ?? null,
      is_locked: isLocked ?? false,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new HTTPException(500, { message: "Failed to create entry" });
  }

  return c.json({ entry: data }, 201);
};

export const listEntriesHandler = async (c: Context<AppEnv>) => {
  const supabaseClient = c.get("supabaseClient");
  const user = c.get("supabaseUser");
  const date = c.req.query("date");

  if (!date) {
    throw new HTTPException(400, { message: "Missing date query parameter" });
  }

  const parsedDate = dateParamSchema.safeParse(date);
  if (!parsedDate.success) {
    throw new HTTPException(400, { message: parsedDate.error.message });
  }

  const { data, error } = await supabaseClient
    .from("entries")
    .select(
      "id, entry_date, entry_time, is_locked, meta, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .eq("entry_date", parsedDate.data)
    .order("created_at", { ascending: true });

  if (error) {
    throw new HTTPException(500, { message: "Failed to list entries" });
  }

  return c.json({ entries: data ?? [] });
};

export const getEntryHandler = async (c: Context<AppEnv>) => {
  const supabaseClient = c.get("supabaseClient");
  const user = c.get("supabaseUser");
  const entryId = c.req.param("id");

  const { data, error } = await supabaseClient
    .from("entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", entryId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new HTTPException(500, { message: "Failed to fetch entry" });
  }

  if (!data) {
    throw new HTTPException(404, { message: "Entry not found" });
  }

  return c.json({ entry: data });
};
