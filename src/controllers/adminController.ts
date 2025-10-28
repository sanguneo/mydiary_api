import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { recordAuditEvent } from "../services/audit";
import type { AppEnv } from "../types/context";
import { adminStatusSchema, requestUnwrapSchema } from "../utils/validators";

export const listUsersHandler = async (c: Context<AppEnv>) => {
  const supabaseClient = c.get("supabaseClient");

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, email, is_disabled, created_at, updated_at, settings");

  if (error) {
    throw new HTTPException(500, { message: "Failed to fetch users" });
  }

  return c.json({ users: data ?? [] });
};

export const suspendUserHandler = async (c: Context<AppEnv>) => {
  const supabaseClient = c.get("supabaseClient");
  const adminUser = c.get("supabaseUser");
  const targetUserId = c.req.param("id");
  const rawBody: unknown = await c.req.json().catch(() => ({}));
  const parsedBody = adminStatusSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    throw new HTTPException(400, { message: "Invalid request body" });
  }

  const reason = parsedBody.data.reason ?? "unspecified";

  const { data, error } = await supabaseClient
    .from("profiles")
    .update({ is_disabled: true })
    .eq("id", targetUserId)
    .select("id, email, is_disabled")
    .maybeSingle();

  if (error) {
    throw new HTTPException(500, { message: "Failed to update user status" });
  }

  if (!data) {
    throw new HTTPException(404, { message: "User not found" });
  }

  await recordAuditEvent(supabaseClient, {
    actor_id: adminUser.id,
    target_user_id: targetUserId,
    action: "admin.suspend_user",
    details: { reason },
  });

  return c.json({ user: data, message: "User suspended" });
};

export const reactivateUserHandler = async (c: Context<AppEnv>) => {
  const supabaseClient = c.get("supabaseClient");
  const adminUser = c.get("supabaseUser");
  const targetUserId = c.req.param("id");

  const { data, error } = await supabaseClient
    .from("profiles")
    .update({ is_disabled: false })
    .eq("id", targetUserId)
    .select("id, email, is_disabled")
    .maybeSingle();

  if (error) {
    throw new HTTPException(500, { message: "Failed to update user status" });
  }

  if (!data) {
    throw new HTTPException(404, { message: "User not found" });
  }

  await recordAuditEvent(supabaseClient, {
    actor_id: adminUser.id,
    target_user_id: targetUserId,
    action: "admin.reactivate_user",
    details: null,
  });

  return c.json({ user: data, message: "User reactivated" });
};

export const requestUnwrapHandler = async (c: Context<AppEnv>) => {
  const supabaseClient = c.get("supabaseClient");
  const adminUser = c.get("supabaseUser");
  const payload: unknown = await c.req.json();

  const parsed = requestUnwrapSchema.safeParse(payload);
  if (!parsed.success) {
    throw new HTTPException(400, {
      message: parsed.error.flatten().formErrors.join(", "),
    });
  }

  const { user_id, entry_id, reason } = parsed.data;

  await recordAuditEvent(supabaseClient, {
    actor_id: adminUser.id,
    target_user_id: user_id,
    action: "admin.request_unwrap",
    details: { entry_id, reason },
  });

  return c.json({ ok: true, message: "Request logged" });
};
