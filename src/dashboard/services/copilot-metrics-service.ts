import { formatResponseError, unknownResponseError } from "@/features/common/response-error";
import { CopilotUsageOutput, CopilotMetricsReportResponse, CopilotMetricsDayReportResponse, CopilotMetricsReportData } from "@/features/common/models";
import { ServerActionResponse } from "@/features/common/server-action-response";
import { ensureGitHubEnvConfig } from "./env-service";
import { stringIsNullOrEmpty, transformCopilotMetricsReportData } from "../utils/helpers";

export interface IFilter {
  startDate?: Date;
  endDate?: Date;
  date?: string;
  enterprise: string;
  organization?: string;
  team?: string[];
}

export const getCopilotMetrics = async (
  filter: IFilter
): Promise<ServerActionResponse<Map<string, CopilotUsageOutput[]>>> => {

  try {
    return getCopilotMetricsFromApi(filter);
  } catch (e) {
    return unknownResponseError(e);
  }
};

export const getCopilotMetricsFromApi = async (
  filter: IFilter
): Promise<ServerActionResponse<Map<string, CopilotUsageOutput[]>>> => {
  const env = ensureGitHubEnvConfig();

  if (env.status !== "OK") {
    return env;
  }

  const { token, version, enterprise } = env.response;

  try {
    const reportUrl = filter.date
      ? `https://api.github.com/enterprises/${enterprise}/copilot/metrics/reports/users-1-day?day=${filter.date}`
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
      return formatResponseError(enterprise, reportResponse);
    }

    const reportData: CopilotMetricsReportResponse | CopilotMetricsDayReportResponse = await reportResponse.json();
    
    if (!reportData.download_links || reportData.download_links.length === 0) {
      return {
        status: "OK",
        response: new Map<string, CopilotUsageOutput[]>(),
      };
    }

    const downloadPromises = reportData.download_links.map(async (downloadUrl) => {
      const downloadResponse = await fetch(downloadUrl, {
        cache: "no-store",
      });

      if (!downloadResponse.ok) {
        throw new Error(`Failed to download: ${downloadResponse.status}`);
      }

      const text = await downloadResponse.text();
      const lines = text.split('\n').filter(line => line.trim());

      // Handle NDJSON (multiple JSON objects, one per line)
      if (lines.length > 0) {
        return lines.flatMap(line => {
          const obj = JSON.parse(line);
          return [obj as CopilotMetricsReportData];
        });
      }
      
      return [];
    });

    const allDownloadedData = await Promise.all(downloadPromises);
    const flattenedData = allDownloadedData.flat();
    const dataUserToUsage = transformCopilotMetricsReportData(flattenedData);
    
    return {
      status: "OK",
      response: dataUserToUsage,
    };
  } catch (e) {
    return unknownResponseError(e);
  }
};