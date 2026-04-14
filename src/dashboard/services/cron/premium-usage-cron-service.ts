import cron, { ScheduledTask } from 'node-cron';
import { requestPremiumUsageReport, getBillingReport, IFilter as BillReportFilter } from '@/services/billing-report-service';
import { processCsvFromDownloadUrl } from '@/handlers/premium-usage-csv-handler';
import { ensureGitHubEnvConfig } from '@/services/env-service';
import { PremiumRequestUsage } from '@/features/common/models';
import PremiumRequestUsageService from '@/services/postgres-db-service';

let premiumUsageTask: ScheduledTask | null = null;
const cronExpression = '0 5,13 * * *';

function log(message: string) {
  console.log(`[PremiumUsage-Cron]: ${message}`);
}

export async function syncPremiumUsageData() {
  try {
    log('Starting Premium Usage data synchronization...');

    const env = ensureGitHubEnvConfig();
    if (env.status !== 'OK') {
      log(`Environment configuration error: ${env.errors[0].message}`);
      return;
    }

    const billReportFilter: BillReportFilter = {
      report_type: 'premium_request',
      startDate: new Date(new Date().setDate(new Date().getDate() - 1)), // Last 1 day
      endDate: new Date(),
    };
    const requestResult = await requestPremiumUsageReport(billReportFilter);
    if (requestResult.status !== 'OK') {
      log(`Failed to request Premium Usage data: ${requestResult.errors[0].message}`);
      return;
    }

    const reportId = requestResult.response.id;
    await new Promise((resolve) => setTimeout(resolve, 30000));

    const reportResult = await getBillingReport(reportId);
    if (reportResult.status !== 'OK') {
      log(`Failed to get Premium Usage data: ${reportResult.errors[0].message}`);
      return;
    }

    if (!reportResult.response.download_urls || reportResult.response.download_urls.length === 0) {
      log(`No download URLs found in the report response. ${JSON.stringify(reportResult.response)}`);
      return;
    }

    const downloadUrl = reportResult.response.download_urls[0];
    log(`Successfully retrieved Premium Usage report. Download URL: ${downloadUrl}`);

    const records: PremiumRequestUsage[] = await processCsvFromDownloadUrl(downloadUrl);
    const dbService = new PremiumRequestUsageService();
    await dbService.insertOrUpdateBatch(records);

    log('Data sync completed');
  } catch (error) {
    log(`Data sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

export function startPremiumUsageTask() {
  if (premiumUsageTask) {
    log('Premium Usage cron job already started');
    return;
  }

  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  premiumUsageTask = cron.schedule(cronExpression, async () => {
    log('Executing scheduled task...');
    await syncPremiumUsageData();
  });

  premiumUsageTask.start();
  log(`Premium Usage cron job started with schedule: ${cronExpression}`);
}

export function stopPremiumUsageTask() {
  if (!premiumUsageTask) {
    return;
  }

  premiumUsageTask.stop();
  premiumUsageTask = null;
  log('Premium Usage cron job stopped');
}

export async function getPremiumUsageTaskStatus() {
  const isRunning = (await premiumUsageTask?.getStatus()) || false;
  return {
    isRunning,
    nextRun: premiumUsageTask?.getNextRun()?.toISOString() || null,
    schedule: cronExpression,
  };
}
