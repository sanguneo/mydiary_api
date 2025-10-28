import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { supabaseAdminClient } from "../services/supabaseClient";
import type { AppEnv } from "../types/context";

const getBearerToken = (authorizationHeader: string | null): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
};

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getBearerToken(c.req.header("authorization") ?? null);

  if (!token) {
    throw new HTTPException(401, {
      message: "Missing or invalid Authorization header",
    });
  }

  const { data, error } = await supabaseAdminClient.auth.getUser(token);

  if (error || !data?.user) {
    throw new HTTPException(401, {
      message: "Unable to validate access token",
    });
  }

  const user = data.user;

  const { data: profileData, error: profileError } = await supabaseAdminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError && profileError.code !== "PGRST116") {
    throw new HTTPException(500, { message: "Failed to fetch profile" });
  }

  if (profileData?.is_disabled) {
    throw new HTTPException(403, { message: "Account is disabled" });
  }

  c.set("supabaseUser", user);
  c.set("profile", profileData ?? null);
  c.set("supabaseClient", supabaseAdminClient);
  c.set("isAdmin", false);

  await next();
};
