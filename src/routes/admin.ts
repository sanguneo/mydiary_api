import { Hono } from "hono";

import {
  listUsersHandler,
  reactivateUserHandler,
  requestUnwrapHandler,
  suspendUserHandler,
} from "../controllers/adminController";
import { adminMiddleware } from "../middleware/admin";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types/context";

const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", authMiddleware);
adminRoutes.use("*", adminMiddleware);
adminRoutes.get("/users", listUsersHandler);
adminRoutes.post("/users/:id/suspend", suspendUserHandler);
adminRoutes.post("/users/:id/reactivate", reactivateUserHandler);
adminRoutes.post("/request-unwrap", requestUnwrapHandler);

export default adminRoutes;
