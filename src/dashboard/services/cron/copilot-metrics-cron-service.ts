import CopilotMetricsDbService from '@/services/copilot-metrics-db-service';
import { fetchRawMetrics } from '@/services/copilot-metrics-service';
import { ensureGitHubEnvConfig } from '@/services/env-service';
import { format, subDays } from 'date-fns';

function log(message: string) {
  console.log(`[CopilotMetrics-Cron]: ${message}`);
}

export async function syncCopilotMetrics() {
  try {
    log('Starting Copilot Metrics data synchronization...');

    const env = ensureGitHubEnvConfig();
    if (env.status !== 'OK') {
      log(`Failed to get env config: ${env.errors[0].message}`);
      return;
    }
    const { token, version, enterprise } = env.response;

    const db = new CopilotMetricsDbService();
    await db.init();

    const latestDay = await db.getLatestDay();
    const isFirstRun = !latestDay;

    if (isFirstRun) {
      log('First run detected, backfilling 28-day data...');
      const rawData = await fetchRawMetrics(enterprise, token, version);
      if (rawData.length === 0) {
        log('No data received from 28-day endpoint');
        return;
      }
      await db.upsertBatch(rawData);
      log(`Backfilled ${rawData.length} records`);
    } else {
      const targetDay = format(subDays(new Date(), 2), 'yyyy-MM-dd');
      if (targetDay <= latestDay) {
        log(`Data for ${targetDay} already up to date (latest: ${latestDay}), skipping`);
        return;
      }
      log(`Fetching data for ${targetDay}...`);
      const rawData = await fetchRawMetrics(enterprise, token, version, targetDay);
      if (rawData.length === 0) {
        log(`No data available for ${targetDay}`);
        return;
      }
      await db.upsertBatch(rawData);
      log(`Synced ${rawData.length} records for ${targetDay}`);
    }

    log('Data sync completed');
  } catch (error) {
    log(`Data sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
