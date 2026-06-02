"use client";

import { useMemo } from "react";
import { useDashboard } from "../premium-requests-state";
import StatsCard from "@/features/dashboard/charts/stats-card";

export const PremiumRequestsStats = () => {
  const { filteredUserUsageData: userUsageData } = useDashboard();

  const { totalUsers, totalRequests, totalCredits } = useMemo(() => {
    let requests = 0;
    let credits = 0;
    for (const row of userUsageData) {
      requests += row.totalRequestQuantity ?? 0;
      credits += row.totalCreditQuantity ?? 0;
    }
    return {
      totalUsers: userUsageData.length,
      totalRequests: Math.round(requests),
      totalCredits: Math.round(credits),
    };
  }, [userUsageData]);

  return (
    <div className="col-span-4 grid grid-cols-3 gap-6">
      <StatsCard
        title="Total Users"
        description="Unique users with premium requests in the selected period"
        value={totalUsers.toLocaleString()}
      />
      <StatsCard
        title="Total Requests"
        description="Sum of all premium requests in the selected period"
        value={totalRequests === 0 ? "N/A" : totalRequests.toLocaleString()}
      />
      <StatsCard
        title="Total Credits"
        description="Sum of all AI credits in the selected period"
        value={totalCredits === 0 ? "N/A" : totalCredits.toLocaleString()}
      />
    </div>
  );
};
