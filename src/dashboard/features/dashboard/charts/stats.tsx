"use client";
import { useDashboard } from "../dashboard-state";
import {
  computeActiveUserAverage,
  computeTotalLinesAdded,
  computeTotalLinesDeleted,
} from "./common";
import StatsCard from "./stats-card";
import { TopThreeModel } from "./top-three-model";

export const Stats = () => {
  const { displayData, isLoading } = useDashboard();
  const averageActiveUsers = computeActiveUserAverage(displayData);
  const totalLinesAdded = computeTotalLinesAdded(displayData);
  const totalLinesDeleted = computeTotalLinesDeleted(displayData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 col-span-4">
      <StatsCard
        title="Active users"
        tip="Average daily users with any Copilot activity in the selected period. Calculation: sum of daily active users ÷ number of days."
        description="Average daily active users"
        value={isLoading ? "..." : Math.round(averageActiveUsers).toLocaleString()}
      />
      <StatsCard
        title="Lines added"
        tip="Total lines of code added by Copilot across all users and features in the selected period."
        description="Total lines added by Copilot"
        value={isLoading ? "..." : totalLinesAdded.toLocaleString()}
      />
      <StatsCard
        title="Lines deleted"
        tip="Total lines of code deleted by Copilot across all users and features in the selected period."
        description="Total lines deleted by Copilot"
        value={isLoading ? "..." : totalLinesDeleted.toLocaleString()}
      />
      <TopThreeModel />
    </div>
  );
};

