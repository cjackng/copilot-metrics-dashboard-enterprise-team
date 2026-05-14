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
  const { displayData, isLoading, currentMonthIdeActiveUsers, currentMonthAgentUsers, generalAdoptionRate, endDate } = useDashboard();

  const agentAdoptionRate = currentMonthIdeActiveUsers > 0
    ? Math.round((currentMonthAgentUsers / currentMonthIdeActiveUsers) * 100)
    : 0;
  const agentContribRate = computeAgentContributionRate(displayData);
  const acceptanceRate = computeCumulativeAcceptanceAverage(displayData);

  const ref = endDate ? new Date(endDate) : new Date();
  const formattedDate = new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric'
  }).format(ref);

  const generalAdoptionDisplay =
    generalAdoptionRate === null ? "N/A" : `${Math.round(generalAdoptionRate)}%`;

  return (
    <div className="col-span-4 flex flex-col gap-4">
      {/* Row 1: Adoption + Rate metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="General adoption"
          tip={`Licensed seats (filtered by team) that were active within 30 days before the end date ÷ total licensed seats from the snapshot ≤ end date. N/A if no seat snapshot is available.`}
          description={`Active seats (last 30 days) / total seats as of ${formattedDate}`}
          value={isLoading ? "..." : generalAdoptionDisplay}
        />
        <StatsCard
          title="Agent adoption"
          tip="Active users who used any agent feature in the calendar month of the selected end date. Calculation: users who used agent ÷ IDE active users in that month × 100%."
          description={`Agent users / IDE active users in ${formattedDate}`}
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
