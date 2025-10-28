import { Hono } from "hono";

import {
  createEntryHandler,
  getEntryHandler,
  listEntriesHandler,
} from "../controllers/entriesController";
import { initProfileHandler } from "../controllers/profileController";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types/context";

const protectedRoutes = new Hono<AppEnv>();

protectedRoutes.use("*", authMiddleware);
protectedRoutes.post("/init", initProfileHandler);
protectedRoutes.get("/entries", listEntriesHandler);
protectedRoutes.post("/entries", createEntryHandler);
protectedRoutes.get("/entries/:id", getEntryHandler);

export default protectedRoutes;
