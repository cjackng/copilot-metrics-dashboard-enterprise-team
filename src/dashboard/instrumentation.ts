declare global {
  var __premiumUsageCronStarted: boolean | undefined;
}

export async function register() {
  if (globalThis.__premiumUsageCronStarted) {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      console.log('[Instrumentation] instrumentation register called, starting cron...');
      const { startPremiumUsageTask } = await import('@/services/cron/premium-usage-cron-service');
      startPremiumUsageTask();
      globalThis.__premiumUsageCronStarted = true;
    } catch (error) {
      globalThis.__premiumUsageCronStarted = false;
      console.error(
        `[Instrumentation] failed to start from instrumentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
