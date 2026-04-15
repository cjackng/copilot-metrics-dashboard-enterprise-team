import { formatResponseError, unknownResponseError } from "@/features/common/response-error";
import { CopilotMetrics, CopilotUsageOutput, CopilotMetricsReportResponse, CopilotMetricsDayReportResponse, CopilotMetricsReportData, CopilotMetricsReportWrapper } from "@/features/common/models";
import { ServerActionResponse } from "@/features/common/server-action-response";
import { SqlQuerySpec } from "@azure/cosmos";
import { format } from "date-fns";
import { cosmosClient, cosmosConfiguration } from "./cosmos-db-service";
import { ensureGitHubEnvConfig } from "./env-service";
import { stringIsNullOrEmpty, applyTimeFrameLabel, transformCopilotMetricsReportData } from "../utils/helpers";
import { sampleData } from "./sample-data";

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
): Promise<ServerActionResponse<CopilotUsageOutput[]>> => {
  const env = ensureGitHubEnvConfig();
  const isCosmosConfig = cosmosConfiguration();

  if (env.status !== "OK") {
    return env;
  }

  const { enterprise } = env.response;

  try {
    if (stringIsNullOrEmpty(filter.enterprise)) {
      filter.enterprise = enterprise;
    }

    if (isCosmosConfig) {
      return getCopilotMetricsFromDatabase(filter);
    }
    
    return getCopilotMetricsFromApi(filter);
  } catch (e) {
    return unknownResponseError(e);
  }
};
// To-Do: add filter with different time frame
export const getCopilotMetricsFromApi = async (
  filter: IFilter
): Promise<ServerActionResponse<CopilotUsageOutput[]>> => {
  const env = ensureGitHubEnvConfig();

  if (env.status !== "OK") {
    return env;
  }

  const { token, version } = env.response;

  try {
    const reportUrl = filter.date
      ? `https://api.github.com/enterprises/${filter.enterprise}/copilot/metrics/reports/enterprise-1-day?day=${filter.date}`
      : `https://api.github.com/enterprises/${filter.enterprise}/copilot/metrics/reports/enterprise-28-day/latest`;
    
    const reportResponse = await fetch(reportUrl, {
      cache: "no-store",
      headers: {
        Accept: `application/vnd.github+json`,
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": version,
      },
    });

    if (!reportResponse.ok) {
      return formatResponseError(filter.enterprise, reportResponse);
    }

    const reportData: CopilotMetricsReportResponse | CopilotMetricsDayReportResponse = await reportResponse.json();
    
    if (!reportData.download_links || reportData.download_links.length === 0) {
      return {
        status: "OK",
        response: [],
      };
    }

    const downloadPromises = reportData.download_links.map(async (downloadUrl) => {
      const downloadResponse = await fetch(downloadUrl, {
        cache: "no-store",
      });

      if (!downloadResponse.ok) {
        throw new Error(`Failed to download: ${downloadResponse.status}`);
      }

      const json = await downloadResponse.json();
      if (Array.isArray(json)) {
        const wrappers = json as CopilotMetricsReportWrapper[];
        return wrappers.flatMap(w => w.day_totals || []);
      } else if (json && typeof json === 'object' && 'day_totals' in json) {
        const wrapper = json as CopilotMetricsReportWrapper;
        return wrapper.day_totals || [];
      } else if (json && typeof json === 'object') {
        const repsonseJson = json as CopilotMetricsReportData;
        return [repsonseJson];
      }
      return [];
    });

    const allDownloadedData = await Promise.all(downloadPromises);
    const flattenedData = allDownloadedData.flat();
    const dataWithTimeFrame = transformCopilotMetricsReportData(flattenedData);
    
    return {
      status: "OK",
      response: dataWithTimeFrame,
    };
  } catch (e) {
    return unknownResponseError(e);
  }
};

export const getCopilotMetricsFromDatabase = async (
  filter: IFilter
): Promise<ServerActionResponse<CopilotUsageOutput[]>> => {
  const client = cosmosClient();
  const database = client.database("platform-engineering");
  const container = database.container("metrics_history");

  let start = "";
  let end = "";
  const maxDays = 365 * 2; // maximum 2 years of data
  const maximumDays = 31;

  if (filter.startDate && filter.endDate) {
    start = format(filter.startDate, "yyyy-MM-dd");
    end = format(filter.endDate, "yyyy-MM-dd");
  } else {
    // set the start date to today and the end date to 31 days ago
    const todayDate = new Date();
    const startDate = new Date(todayDate);
    startDate.setDate(todayDate.getDate() - maximumDays);

    start = format(startDate, "yyyy-MM-dd");
    end = format(todayDate, "yyyy-MM-dd");
  }

  let querySpec: SqlQuerySpec = {
    query: `SELECT * FROM c WHERE c.date >= @start AND c.date <= @end`,
    parameters: [
      { name: "@start", value: start },
      { name: "@end", value: end },
    ],
  };

  if (filter.enterprise) {
    querySpec.query += ` AND c.enterprise = @enterprise`;
    querySpec.parameters?.push({
      name: "@enterprise",
      value: filter.enterprise,
    });
  }

  if (filter.organization) {
    querySpec.query += ` AND c.organization = @organization`;
    querySpec.parameters?.push({
      name: "@organization",
      value: filter.organization,
    });
  }
  if (filter.team && filter.team.length > 0) {
    if (filter.team.length === 1) {
      querySpec.query += ` AND c.team = @team`;
      querySpec.parameters?.push({ name: "@team", value: filter.team[0] });
    } else {
      const teamConditions = filter.team
        .map((_, index) => `c.team = @team${index}`)
        .join(" OR ");
      querySpec.query += ` AND (${teamConditions})`;
      filter.team.forEach((team, index) => {
        querySpec.parameters?.push({ name: `@team${index}`, value: team });
      });
    }
  }else {
    querySpec.query += ` AND c.team = null`;
  }

  const { resources } = await container.items
    .query<CopilotMetrics>(querySpec, {
      maxItemCount: maxDays,
    })
    .fetchAll();

  const dataWithTimeFrame = applyTimeFrameLabel(resources);
  return {
    status: "OK",
    response: dataWithTimeFrame,
  };
};

export const _getCopilotMetrics = (): Promise<CopilotUsageOutput[]> => {
  const promise = new Promise<CopilotUsageOutput[]>((resolve) => {
    setTimeout(() => {
      const weekly = applyTimeFrameLabel(sampleData);
      resolve(weekly);
    }, 1000);
  });

  return promise;
};
