"use client";
import { useDashboard } from "../dashboard-state";
import {
  computeActiveUserAverage,
  computeCumulativeAcceptanceAverage,
  computeTotalLinesAdded,
  computeTotalLinesDeleted,
} from "./common";
import StatsCard from "./stats-card";
import { format, parseISO } from "date-fns";

export const Stats = () => {
  const { displayData, isLoading, lastUpdatedTime } = useDashboard();
  const acceptanceAverage = computeCumulativeAcceptanceAverage(displayData);
  const averageActiveUsers = computeActiveUserAverage(displayData);
  const totalLinesAdded = computeTotalLinesAdded(displayData);
  const totalLinesDeleted = computeTotalLinesDeleted(displayData);

  const formattedLastUpdated = lastUpdatedTime
    ? format(parseISO(lastUpdatedTime), "dd MMM yyyy HH:mm")
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 col-span-4">
      {formattedLastUpdated && (
        <p className="col-span-4 text-xs text-muted-foreground text-right">
          Data last updated: {formattedLastUpdated}
        </p>
      )}
      <StatsCard
        title="Acceptance average"
        tip="Rate at which users accept Copilot's code suggestions across all features. Calculation: total accepted ÷ total suggested × 100%."
        description="Code suggestions acceptance rate"
        value={isLoading ? "..." : Math.round(acceptanceAverage) + "%"}
      ></StatsCard>
      <StatsCard
        title="Active users"
        tip="Average daily users with any Copilot activity in the selected period. Calculation: sum of daily active users ÷ number of days."
        description="Average daily active users"
        value={isLoading ? "..." : Math.round(averageActiveUsers).toLocaleString()}
      ></StatsCard>
      <StatsCard
        title="Lines added"
        tip="Total lines of code added by Copilot across all users and features in the selected period."
        description="Total lines added by Copilot"
        value={isLoading ? "..." : totalLinesAdded.toLocaleString()}
      ></StatsCard>
      <StatsCard
        title="Lines deleted"
        tip="Total lines of code deleted by Copilot across all users and features in the selected period."
        description="Total lines deleted by Copilot"
        value={isLoading ? "..." : totalLinesDeleted.toLocaleString()}
      ></StatsCard>
    </div>
  );
};
