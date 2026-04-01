import { formatResponseError, unknownResponseError } from "@/features/common/response-error";
import { ServerActionResponse } from "@/features/common/server-action-response";
import { PremiumRequestUsage } from "@/features/common/models";

export interface IFilter {
  startDate?: Date;
  endDate?: Date;
}

const getPremiumRequestUsageFromDB = async (filter: IFilter): Promise<ServerActionResponse<PremiumRequestUsage[]>> => {
  const PremiumRequestUsageService = (await import('./postgres-db-service')).default;
  const service = new PremiumRequestUsageService();
  await service.init();
  
  try {
    const rows = await service.getAllRows();
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
  
  // To-Do: apply getPremiumRequestUsageFromDB
  // To-Do: update getPremiumRequestUsageFromDB to with filter
  // To-Do: add join

  return {
    status: "OK",
    response: [],
  };
};
