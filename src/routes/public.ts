import { Hono } from "hono";

import type { AppEnv } from "../types/context";

const publicRoutes = new Hono<AppEnv>();

publicRoutes.get("/health", (c) => c.json({ status: "ok" }));

export default publicRoutes;
