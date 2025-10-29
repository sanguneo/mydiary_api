import env from './config/env';
import { app } from './app';

// ──────────────────────────────────────────────
// 서버 설정
// ──────────────────────────────────────────────
const port = Number(env.PORT ?? '3000');

const server = Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Hono server running on http://localhost:${port}`);

// ──────────────────────────────────────────────
// Graceful Shutdown
// ──────────────────────────────────────────────
const shutdown = async () => {
  console.log('\n🧹 Shutting down gracefully...');

  try {
    // 1️⃣ FS Watch 종료
    if ((globalThis as any).__FS_WATCHER__) {
      await (globalThis as any).__FS_WATCHER__.close();
      console.log('🪶 FS Watcher closed');
    }

    // 2️⃣ SSE Controller 종료
    if ((globalThis as any).__SSE_CONTROLLERS__) {
      const controllers = (globalThis as any).__SSE_CONTROLLERS__ as Array<any>;
      for (const ctrl of controllers) {
        try {
          ctrl.close?.();
        } catch (e) {
          console.warn('⚠️ SSE controller close failed:', e);
        }
      }
      console.log('🔌 SSE Controllers closed');
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
          console.warn('⚠️ Failed to kill process', err);
        }
      }
      console.log('💀 Child processes terminated');
    }

    // 4️⃣ Bun 서버 종료
    if (typeof server.stop === 'function') {
      await server.stop();
      console.log('🧩 Server stopped gracefully');
    }

    // 5️⃣ 종료 완료
    console.log('👋 Goodbye.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

// OS 신호에 반응
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
