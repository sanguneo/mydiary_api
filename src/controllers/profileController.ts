import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { recordAuditEvent } from "../services/audit";
import { generateAccountMasterKey, wrapSecret } from "../services/crypto";
import type { AppEnv } from "../types/context";

export const initProfileHandler = async (c: Context<AppEnv>) => {
  const supabaseClient = c.get("supabaseClient");
  const user = c.get("supabaseUser");
  const existingProfile = c.get("profile");

  if (existingProfile) {
    return c.json({
      ok: true,
      message: "Profile already initialized",
      profile: existingProfile,
    });
  }

  const accountKey = generateAccountMasterKey();
  const wrapped = wrapSecret(accountKey);

  const accountKeyMeta = {
    wrappedKey: wrapped.wrapped,
    iv: wrapped.iv,
    authTag: wrapped.authTag,
    algorithm: "AES-256-GCM",
  };

  const { data, error } = await supabaseClient
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      account_key_meta: accountKeyMeta,
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new HTTPException(500, { message: "Failed to initialize profile" });
  }

  await recordAuditEvent(supabaseClient, {
    actor_id: user.id,
    target_user_id: user.id,
    action: "profile.init",
    details: { email: user.email },
  });

  return c.json({ ok: true, message: "initialized", profile: data });
};
