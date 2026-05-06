declare global {
  var __cronStarted: boolean | undefined;
}

export async function register() {
  if (globalThis.__cronStarted) {
    return;
  }
  console.log(`[Instrumentation] current environment: ${process.env.NODE_ENV}`);
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'production') {
    try {
      console.log('[Instrumentation] instrumentation register called, starting cron...');
      const { startUnifiedCronTask } = await import('@/services/cron/cron-service');
      startUnifiedCronTask();
      globalThis.__cronStarted = true;
    } catch (error) {
      globalThis.__cronStarted = false;
      console.error(
        `[Instrumentation] failed to start from instrumentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
