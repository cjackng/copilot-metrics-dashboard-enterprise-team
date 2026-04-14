import { formatResponseError, unknownResponseError } from "@/features/common/response-error";
import { ServerActionResponse } from "@/features/common/server-action-response";
import { PremiumRequestUsage } from "@/features/common/models";
import { format } from "date-fns";

export interface IFilter {
  startDate?: Date;
  endDate?: Date;
  month?: string;
}

const getPremiumRequestUsageFromDB = async (filter: IFilter): Promise<ServerActionResponse<PremiumRequestUsage[]>> => {
  const PremiumRequestUsageService = (await import('./postgres-db-service')).default;
  const service = new PremiumRequestUsageService();
  await service.init();
  const defaultDays = 31;
  
  try {
    let start = "";
    let end = "";
    if (filter.startDate && filter.endDate) {
      start = format(filter.startDate, "yyyy-MM-dd");
      end = format(filter.endDate, "yyyy-MM-dd");
    } else {
      // set the start date to today and the end date to 31 days ago
      const todayDate = new Date();
      const startDate = new Date(todayDate);
      startDate.setDate(todayDate.getDate() - defaultDays);
  
      start = format(startDate, "yyyy-MM-dd");
      end = format(todayDate, "yyyy-MM-dd");
    }

    const rows = await service.getRowsByDateRange(start, end);
    console.log(`Fetched ${rows.length} premium request usage records from DB for date range ${start} to ${end}`);

    return {
      status: "OK",
      response: rows,
    };
  } catch (error) {
    console.error("Failed to fetch premium request usage from DB:", error);
    return unknownResponseError(error);
  } finally {
    await service.close();
  }
}

export const getPremiumRequestUsage = async (
  filter: IFilter
): Promise<ServerActionResponse<PremiumRequestUsage[]>> => {
  
  const result = await getPremiumRequestUsageFromDB(filter);

  if (result.status !== "OK" || !result.response) {
    return {
      status: "ERROR",
      errors: [{ message: "No data found" }],
    };
  }

  return {
    status: "OK",
    response: result.response,
  };
};

export const getLatestPremiumRequestUsageUpdateTime = async (): Promise<ServerActionResponse<Date | null>> => {
  const PremiumRequestUsageService = (await import('./postgres-db-service')).default;
  const service = new PremiumRequestUsageService();
  await service.init();

  try {
    const latestUpdateTime = await service.getLatestUpdateTime();

    return {
      status: "OK",
      response: latestUpdateTime || null,
    };
  } catch (error) {
    console.error("Failed to fetch latest premium request usage update time from DB:", error);
    return unknownResponseError(error);
  } finally {
    await service.close();
  }
}
