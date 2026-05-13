"use client";

import { useMemo } from "react";
import { useDashboard } from "../premium-requests-state";
import StatsCard from "@/features/dashboard/charts/stats-card";

export const PremiumRequestsStats = () => {
  const { filteredUserUsageData: userUsageData } = useDashboard();

  const { totalUsers, totalRequests } = useMemo(() => {
    let requests = 0;
    for (const row of userUsageData) {
      requests += row.totalRequestQuantity ?? 0;
    }
    return {
      totalUsers: userUsageData.length,
      totalRequests: Math.round(requests),
    };
  }, [userUsageData]);

  return (
    <>
      <StatsCard
        title="Total Users"
        description="Unique users with premium requests in the selected period"
        value={totalUsers.toLocaleString()}
      />
      <StatsCard
        title="Total Requests"
        description="Sum of all premium requests in the selected period"
        value={totalRequests.toLocaleString()}
      />
    </>
  );
};
