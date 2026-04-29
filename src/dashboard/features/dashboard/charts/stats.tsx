"use client";
import { useDashboard } from "../dashboard-state";
import {
  computeActiveUserAverage,
  computeCumulativeAcceptanceAverage,
  computeTotalLinesAdded,
  computeTotalLinesDeleted,
} from "./common";
import StatsCard from "./stats-card";

export const Stats = () => {
  const { displayData, isLoading } = useDashboard();
  const acceptanceAverage = computeCumulativeAcceptanceAverage(displayData);
  const averageActiveUsers = computeActiveUserAverage(displayData);
  const totalLinesAdded = computeTotalLinesAdded(displayData);
  const totalLinesDeleted = computeTotalLinesDeleted(displayData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 col-span-4">
      <StatsCard
        title="Acceptance average"
        tip="How often users accept Copilot's code suggestions across all features (inline completions, chat, etc.). Calculated as: total accepted suggestions ÷ total suggestions × 100%, summed across all days in the selected period."
        description="Accepted ÷ suggested code overall"
        value={isLoading ? "..." : acceptanceAverage.toFixed(0) + "%"}
      ></StatsCard>
      <StatsCard
        title="Active users"
        tip="Average number of users with any daily Copilot activity over the selected period. Calculated as: sum of daily active users ÷ number of days. Includes passive activity (e.g. receiving a suggestion) and engagement (e.g. accepting a suggestion or prompting chat)."
        description="Average daily active users"
        value={isLoading ? "..." : averageActiveUsers.toFixed(0) + ""}
      ></StatsCard>
      <StatsCard
        title="Lines added"
        tip="Total lines of code added via Copilot across all features and all users in the selected period. Sourced from the loc_added_sum field in the GitHub Copilot Metrics API."
        description="Total lines added by Copilot"
        value={isLoading ? "..." : totalLinesAdded.toLocaleString()}
      ></StatsCard>
      <StatsCard
        title="Lines deleted"
        tip="Total lines of code deleted via Copilot across all features and all users in the selected period. Sourced from the loc_deleted_sum field in the GitHub Copilot Metrics API."
        description="Total lines deleted by Copilot"
        value={isLoading ? "..." : totalLinesDeleted.toLocaleString()}
      ></StatsCard>
    </div>
  );
};
