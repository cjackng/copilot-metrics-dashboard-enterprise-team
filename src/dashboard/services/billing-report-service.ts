import { formatResponseError, unknownResponseError } from "@/features/common/response-error";
import { ServerActionResponse } from "@/features/common/server-action-response";
import { ensureGitHubEnvConfig } from "./env-service";
import { stringIsNullOrEmpty } from "../utils/helpers";
import dayjs from 'dayjs';

const maxRetries = 10;
const retryDelayMs = 60000; // 60 seconds

export interface BillingReportRequest {
  report_type: string;
  start_date: string; // ISO date format: YYYY-MM-DD
  end_date: string;   // ISO date format: YYYY-MM-DD
}

export interface BillingReportResponse {
  id: string;
  report_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  actor: string;
  download_urls?: Array<string>;
}

export interface IFilter {
  report_type: 'detailed'|'summarized'|'premium_request';
  startDate?: Date;
  endDate?: Date;
}

export const requestPremiumUsageReport = async (
  filter: IFilter
): Promise<ServerActionResponse<BillingReportResponse>> => {
  const env = ensureGitHubEnvConfig();

  if (env.status !== 'OK') {
    return env;
  }

  const { token, version, enterprise } = env.response;

  try {

    // Format dates
    const endDate = filter.endDate || new Date();
    const startDate = filter.startDate || new Date(); 

    const start_date_str = dayjs(startDate).format('YYYY-MM-DD');
    const end_date_str = dayjs(endDate).format('YYYY-MM-DD');

    console.log(`[Request BillingReport] Requesting billing report for enterprise: ${enterprise}`);
    console.log(`[Request BillingReport] Date range: ${start_date_str} to ${end_date_str}`);

    // Prepare request body
    const requestBody: BillingReportRequest = {
      report_type: filter.report_type,
      start_date: start_date_str,
      end_date: end_date_str
    };

    // Make API request
    const billingReportUrl = `https://api.github.com/enterprises/${enterprise}/settings/billing/reports`;

    console.debug(`[Request Billing Report] Making request to: ${billingReportUrl}`);
    console.debug(`[Request Billing Report] Request body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch(billingReportUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': version,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`[Request Billing Report] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Request Billing Report] API request failed: ${response.status} - ${errorText}`);

      return formatResponseError("Request BillingReport", response);
    }

    const billingReport: BillingReportResponse = await response.json();

    // Log the response details
    console.log(`[Request Billing Report] Successfully created billing report, full response:`, JSON.stringify(billingReport, null, 2));

    return {
      status: 'OK',
      response: billingReport
    };

  } catch (error) {
    console.error(`[Request Billing Report] Error requesting billing report:`, error);
    return unknownResponseError(error);
  }
};

export const getBillingReport = async (
  reportId: string
): Promise<ServerActionResponse<BillingReportResponse>> => {
  const env = ensureGitHubEnvConfig();

  if (env.status !== 'OK') {
    return env;
  }

  const { token, version, enterprise } = env.response;

  try {
    const reportUrl = `https://api.github.com/enterprises/${enterprise}/settings/billing/reports/${reportId}`;
    let runs = 1;
    
    while (runs <= maxRetries) {
      console.log(`[Get Billing Report] Checking status for report ID: ${reportId}, attempt ${runs} of ${maxRetries}`);
      
      const response = await fetch(reportUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'X-GitHub-Api-Version': version,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Get Billing Report] API request failed: ${response.status} - ${errorText}`);
        return formatResponseError("Get BillingReport", response);
      }

      const billingReport: BillingReportResponse = await response.json();
      console.log(`[Get Billing Report] Report ${reportId} status: ${billingReport.status}`);
      console.debug(`[Get Billing Report] Report ${reportId} full response:`, JSON.stringify(billingReport, null, 2));

      if (billingReport.status === 'completed') {
        return {
          status: 'OK',
          response: billingReport
        };
      } else {
        console.log(`[Get Billing Report] Waiting for ${retryDelayMs / 1000} seconds before retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs)); // Wait for retry delay before next attempt
        runs++;
      }
    }

    // Max attempts reached, return error
    console.error(`[Get Billing Report] Report ${reportId} did not complete after ${maxRetries} attempts.`);
    return {
      status: 'ERROR',
      errors: [{
        message: `Report ${reportId} did not complete after ${maxRetries} attempts. The report may be taking longer than expected or there might be an issue with the report generation.`
      }]
    };

  } catch (error) {
    console.error(`[Get Billing Report] Error getting billing report status:`, error);
    return unknownResponseError(error);
  }
};
