import env from './config/env';
import { app } from './app';
import { logger } from './lib/logger';

// ──────────────────────────────────────────────
// 서버 설정
// ──────────────────────────────────────────────
const port = Number(env.PORT ?? '3000');

const server = Bun.serve({
  fetch: app.fetch,
  port,
});

logger.info({ port }, 'Hono server running');

// ──────────────────────────────────────────────
// Graceful Shutdown
// ──────────────────────────────────────────────
const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  try {
    // 1️⃣ FS Watch 종료
    if ((globalThis as any).__FS_WATCHER__) {
      await (globalThis as any).__FS_WATCHER__.close();
      logger.info('FS Watcher closed');
    }

    // 2️⃣ SSE Controller 종료
    if ((globalThis as any).__SSE_CONTROLLERS__) {
      const controllers = (globalThis as any).__SSE_CONTROLLERS__ as Array<any>;
      for (const ctrl of controllers) {
        try {
          ctrl.close?.();
        } catch (e) {
          logger.warn({ error: e }, 'SSE controller close failed');
        }
      }
      logger.info('SSE Controllers closed');
    }

    // 3️⃣ 자식 프로세스 종료
    if ((globalThis as any).__CHILD_PROCESSES__) {
      const processes = (globalThis as any).__CHILD_PROCESSES__ as Array<any>;
      for (const proc of processes) {
        try {
          if (Bun.env.OS === 'Windows_NT') {
            Bun.spawn(['taskkill', '/pid', proc.pid.toString(), '/T', '/F']);
          } else {
            proc.kill('SIGTERM');
            setTimeout(() => proc.kill('SIGKILL'), 2000);
          }
        } catch (err) {
          logger.warn({ error: err }, 'Failed to kill process');
        }
      }
      logger.info('Child processes terminated');
    }

    // 4️⃣ Bun 서버 종료
    if (typeof server.stop === 'function') {
      await server.stop();
      logger.info('Server stopped gracefully');
    }

    // 5️⃣ 종료 완료
    logger.info('Goodbye.');
    process.exit(0);
  } catch (err) {
    logger.error({ error: err }, 'Error during shutdown');
    process.exit(1);
  }
};

// OS 신호에 반응
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
