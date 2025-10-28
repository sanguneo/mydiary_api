import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import type { AppEnv } from "../types/context";

export const adminMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get("supabaseUser");
  const supabaseClient = c.get("supabaseClient");

  const { data, error } = await supabaseClient
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new HTTPException(500, { message: "Failed to verify admin role" });
  }

  if (!data) {
    throw new HTTPException(403, { message: "Admin access required" });
  }

  c.set("isAdmin", true);
  await next();
};
