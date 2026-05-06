import { formatResponseError, unknownResponseError } from "@/features/common/response-error";
import { CopilotUsageOutputResponse, CopilotUsageOutput, CopilotMetricsReportResponse, CopilotMetricsDayReportResponse, CopilotMetricsReportData } from "@/features/common/models";
import { ServerActionResponse } from "@/features/common/server-action-response";
import { ensureGitHubEnvConfig } from "./env-service";
import { stringIsNullOrEmpty, transformCopilotMetricsReportData } from "../utils/helpers";
import CopilotMetricsDbService from "./copilot-metrics-db-service";

export interface IFilter {
  startDate: Date | string;
  endDate: Date | string;
  date?: string;
  enterprise: string;
  organization?: string;
  team?: string[];
}

export const getCopilotMetrics = async (
  filter: IFilter
): Promise<ServerActionResponse<CopilotUsageOutputResponse>> => {
  try {
    const startStr = filter.startDate instanceof Date
      ? filter.startDate.toISOString().slice(0, 10)
      : String(filter.startDate);
    const endStr = filter.endDate instanceof Date
      ? filter.endDate.toISOString().slice(0, 10)
      : String(filter.endDate);
    return getCopilotMetricsFromDB(startStr, endStr);
  } catch (e) {
    return unknownResponseError(e);
  }
};

/** Fetch and return raw per-user metrics data from the GitHub API without transformation. */
export const fetchRawMetrics = async (
  enterprise: string,
  token: string,
  version: string,
  date?: string,
): Promise<CopilotMetricsReportData[]> => {
  const reportUrl = date
    ? `https://api.github.com/enterprises/${enterprise}/copilot/metrics/reports/users-1-day?day=${date}`
    : `https://api.github.com/enterprises/${enterprise}/copilot/metrics/reports/users-28-day/latest`;

  const reportResponse = await fetch(reportUrl, {
    cache: "no-store",
    headers: {
      Accept: `application/vnd.github+json`,
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": version,
    },
  });

  if (!reportResponse.ok) {
    console.error(`[fetchRawMetrics] API error ${reportResponse.status}: ${reportResponse.statusText}`);
    return [];
  }

  const reportData: CopilotMetricsReportResponse | CopilotMetricsDayReportResponse =
    await reportResponse.json();

  if (!reportData.download_links || reportData.download_links.length === 0) {
    return [];
  }

  const downloadPromises = reportData.download_links.map(async (downloadUrl) => {
    const downloadResponse = await fetch(downloadUrl, { cache: "no-store" });
    if (!downloadResponse.ok) return [] as CopilotMetricsReportData[];
    const text = await downloadResponse.text();
    return text
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as CopilotMetricsReportData);
  });

  const allData = await Promise.all(downloadPromises);
  return allData.flat();
};

/** Read metrics from the DB for a date range and return in the same shape as the API path. */
export const getCopilotMetricsFromDB = async (
  startDate: string,
  endDate: string,
): Promise<ServerActionResponse<CopilotUsageOutputResponse>> => {
  try {
    const db = new CopilotMetricsDbService();
    await db.init();
    const rows = await db.getByDateRange(startDate, endDate);
    const copilotUsages = transformCopilotMetricsReportData(rows);
    return {
      status: "OK",
      response: {
        report_start_day: startDate,
        report_end_day: endDate,
        copilotUsages,
      },
    };
  } catch (e) {
    return unknownResponseError(e);
  }
};

/** Returns the latest update_at timestamp from the metrics table, or null if the table is empty. */
export const getMetricsLastUpdated = async (): Promise<Date | null> => {
  try {
    const db = new CopilotMetricsDbService();
    return db.getLatestUpdateTime();
  } catch {
    return null;
  }
};