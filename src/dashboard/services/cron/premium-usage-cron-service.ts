import { requestPremiumUsageReport, getBillingReport, IFilter as BillReportFilter } from '@/services/billing-report-service';
import { downloadPremiumUsageCsv } from '@/handlers/premium-usage-csv-handler';
import { PremiumRequestUsage } from '@/features/common/models';
import PostgresService from '@/services/postgres-db-service';
import { getAllEnterpriseMembersLookupFresh } from '../enterprise-members-service';
import EnterpriseTeamService from '../enterprise-team-service';

function log(message: string) {
  console.log(`[PremiumUsage-Cron]: ${message}`);
}

export async function syncPremiumUsageData() {
  try {
    log('Starting Premium Usage data synchronization...');

    const dbService = new PostgresService();
    const enterpriseTeamService = new EnterpriseTeamService(dbService);
    const latestUpdateTime = await dbService.getLatestUpdateTime();
    const startDate: Date = latestUpdateTime ? latestUpdateTime : new Date(); // Last updated day

    const billReportFilter: BillReportFilter = {
      report_type: 'premium_request',
      startDate: startDate,
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

    const records: PremiumRequestUsage[] = await downloadPremiumUsageCsv(downloadUrl);
    const { memberMap: enterpriseMembers, teams: enterpriseTeams } = await getAllEnterpriseMembersLookupFresh();
    const enrichedRecords: PremiumRequestUsage[] = records.map((record) => {
      const login = record.username;
      const member = enterpriseMembers.get(login);

      if (!member) {
        throw new Error(`No member found for username: ${login}`);
      }

      return {
        ...record,
        display_username: member.display_name || '',
        team: '',
      };
    });

    await Promise.all([
      dbService.insertOrUpdateBatch(enrichedRecords),
      enterpriseTeamService.upsertEnterpriseTeamsBatch(enterpriseTeams)
    ]);

    log('Data sync completed');
  } catch (error) {
    log(`Data sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}