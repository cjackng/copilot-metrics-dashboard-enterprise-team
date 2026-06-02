import cron, { ScheduledTask } from 'node-cron';
import { syncPremiumUsageData } from './premium-usage-cron-service';
import { syncCopilotMetrics } from './copilot-metrics-cron-service';
import { syncSeatsSnapshot } from './copilot-seats-cron-service';

let unifiedTask: ScheduledTask | null = null;
let isTaskRunning = false;
const cronExpression = '0 5,13 * * *';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 5000;

function log(message: string) {
  console.log(`[Cron]: ${message}`);
}

/**
 * Retries `fn` up to `maxRetries` times with exponential backoff.
 * Note: only use for idempotent operations. Do not wrap tasks that have
 * irreversible side effects on the first attempt (e.g. creating a billing report).
 */
async function withRetry(
  fn: () => Promise<void>,
  name: string,
  maxRetries = MAX_RETRIES,
  initialDelayMs = INITIAL_RETRY_DELAY_MS,
): Promise<void> {
  let delayMs = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fn();
      if (attempt > 1) {
        log(`${name} succeeded on attempt ${attempt}/${maxRetries}`);
      }
      return;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (attempt < maxRetries) {
        log(`${name} failed (attempt ${attempt}/${maxRetries}): ${msg}. Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      } else {
        log(`${name} failed after ${maxRetries} attempts: ${msg}`);
      }
    }
  }
}

export function startUnifiedCronTask() {
  if (unifiedTask) {
    log('Unified cron job already started');
    return;
  }

  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  unifiedTask = cron.schedule(cronExpression, async () => {
    if (isTaskRunning) {
      log('Previous execution still running, skipping this cycle');
      return;
    }

    isTaskRunning = true;
    log('Executing scheduled tasks...');

    try {
      await withRetry(() => syncPremiumUsageData(), 'Premium usage sync');
      await withRetry(() => syncCopilotMetrics(), 'Copilot metrics sync');
      await withRetry(() => syncSeatsSnapshot(), 'Seats snapshot sync');
    } finally {
      isTaskRunning = false;
    }

    log('All scheduled tasks completed');
  });

  unifiedTask.start();
  log(`Unified cron job started with schedule: ${cronExpression}`);
}

export function stopUnifiedCronTask() {
  if (!unifiedTask) return;
  unifiedTask.stop();
  unifiedTask = null;
  log('Unified cron job stopped');
}

export async function getUnifiedCronTaskStatus() {
  const isRunning = (await unifiedTask?.getStatus()) || false;
  return {
    isRunning,
    nextRun: unifiedTask?.getNextRun()?.toISOString() ?? null,
    schedule: cronExpression,
  };
}
