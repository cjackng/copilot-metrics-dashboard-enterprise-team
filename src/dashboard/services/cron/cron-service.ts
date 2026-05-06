import cron, { ScheduledTask } from 'node-cron';
import { syncPremiumUsageData } from './premium-usage-cron-service';
import { syncCopilotMetrics } from './copilot-metrics-cron-service';
import { syncSeatsSnapshot } from './copilot-seats-cron-service';

let unifiedTask: ScheduledTask | null = null;
const cronExpression = '0 5,13 * * *';

function log(message: string) {
  console.log(`[Cron]: ${message}`);
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
    log('Executing scheduled tasks...');
    
    try {
      log('Executing premium usage data sync...');
      await syncPremiumUsageData();
    } catch (error) {
      log(`Premium usage sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      log('Executing Copilot metrics sync...');
      await syncCopilotMetrics();
    } catch (error) {
      log(`Copilot metrics sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      log('Executing seats snapshot sync...');
      await syncSeatsSnapshot();
    } catch (error) {
      log(`Seats snapshot sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
