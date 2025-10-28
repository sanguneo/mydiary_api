import { serve } from "bun";

import app from "./app";

const port = Number(process.env.PORT ?? 3000);

console.log(`Diary API listening on http://localhost:${port}`);

serve({
  port,
  fetch: app.fetch,
});
