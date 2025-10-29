import env from './config/env';
import { app } from './app';

const port = Number(env.PORT ?? '3000');
const handler = app.fetch.bind(app);

type HonoFetch = (request: Request, env?: unknown, executionCtx?: unknown) => Response | Promise<Response>;
const honoFetch = handler as HonoFetch;

if (typeof Bun !== 'undefined') {
  Bun.serve({
    fetch: honoFetch as unknown as typeof fetch,
    port,
  });
  console.log(`Server running on http://localhost:${port}`);
} else {
  import('@hono/node-server').then(({ serve }) => {
    serve({ fetch: honoFetch, port });
    console.log(`Server running on http://localhost:${port}`);
  });
}
