import { Hono } from "hono";

import adminRoutes from "./routes/admin";
import protectedRoutes from "./routes/protected";
import publicRoutes from "./routes/public";
import type { AppEnv } from "./types/context";

const app = new Hono<AppEnv>();

app.route("/api", publicRoutes);
app.route("/api", protectedRoutes);
app.route("/api/admin", adminRoutes);

export default app;
