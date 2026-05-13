"use client";
import { useDashboard } from "../dashboard-state";
import {
  computeAgentContributionRate,
  computeCumulativeAcceptanceAverage,
} from "./common";
import StatsCard from "./stats-card";
import { TopThreeModel } from "./top-three-model";
import { LinesAddedDeletedCard } from "./lines-added-deleted-card";

export const Stats = () => {
  const { displayData, isLoading, currentMonthIdeActiveUsers, currentMonthAgentUsers, endDate } = useDashboard();

  const agentAdoptionRate = currentMonthIdeActiveUsers > 0
    ? parseFloat(((currentMonthAgentUsers / currentMonthIdeActiveUsers) * 100).toFixed(0))
    : 0;
  const agentContribRate = computeAgentContributionRate(displayData);
  const acceptanceRate = computeCumulativeAcceptanceAverage(displayData);

  const date = new Date(endDate ?? Date.now());
  const formattedDate = new Intl.DateTimeFormat('en', { 
    month: 'short', 
    year: 'numeric' 
  }).format(date);

  return (
    <div className="col-span-4 flex flex-col gap-4">
      {/* Row 1: Rate metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Agent adoption"
          tip="Active users who used any agent feature in the calendar month of the selected end date. Calculation: users who used agent ÷ IDE active users in that month × 100%."
          description={`Agent users / IDE active users in month of ${formattedDate}`}
          value={isLoading ? "..." : `${agentAdoptionRate}%`}
        />
        <StatsCard
          title="Agent Contribution Rate"
          tip="Percentage of total lines changed (added + deleted) that were produced by agent mode (Edit). Calculation: agent lines changed ÷ total lines changed × 100%."
          description="Agent lines changed / total lines changed"
          value={isLoading ? "..." : `${agentContribRate}%`}
        />
        <StatsCard
          title="Acceptance Rate"
          tip="Rate at which Copilot-suggested lines of code are accepted across all features (except others). Calculation: lines accepted ÷ lines suggested × 100%."
          description="Lines accepted / lines suggested (all features)"
          value={isLoading ? "..." : `${acceptanceRate}%`}
        />
      </div>
      {/* Row 2: Activity metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="IDE active users"
          tip="Copilot-licensed users who interacted with Copilot in the calendar month of the selected end date."
          description={`Unique active users in month of ${formattedDate}`}
          value={isLoading ? "..." : currentMonthIdeActiveUsers.toLocaleString()}
        />
        <TopThreeModel />
        <LinesAddedDeletedCard />
      </div>
    </div>
  );
};
