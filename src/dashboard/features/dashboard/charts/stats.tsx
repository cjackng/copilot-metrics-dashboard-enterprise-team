"use client";
import { useDashboard } from "../dashboard-state";
import {
  computeAgentContributionRate,
  computeNonAgentContributionRate,
  computeCodeCompletionAcceptanceRateTotal,
  computeCliAcceptanceRateTotal,
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
  const nonAgentContribRate = computeNonAgentContributionRate(displayData);
  const codeCompletionAcceptanceRate = computeCodeCompletionAcceptanceRateTotal(displayData);
  const cliAcceptanceRate = computeCliAcceptanceRateTotal(displayData);

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
          title="Active Seat Adoption "
          tip={`Licensed seats that were active within 30 days before the end date ÷ total licensed seats from the snapshot ≤ end date. N/A if no seat snapshot is available.`}
          description={`Active assigned seats`}
          value={isLoading ? "..." : generalAdoptionDisplay}
        />
        <StatsCard
          title="Agent adoption"
          tip="Users who used agent ÷ IDE active users in calendar month of the selected end date × 100%"
          description={`Active users used any agent feature`}
          value={isLoading ? "..." : `${agentAdoptionRate}%`}
        />
        <StatsCard
          title="Code Completion Acceptance"
          tip="Lines accepted ÷ lines suggested × 100% for the code_completion feature"
          description="LOC-based accepted"
          value={isLoading ? "..." : `${codeCompletionAcceptanceRate}%`}
        />
        <StatsCard
          title="CLI Acceptance"
          tip="Acceptance activity counts ÷ generation activity counts × 100% for copilot_cli feature"
          description="Count-based accepted"
          value={isLoading ? "..." : `${cliAcceptanceRate}%`}
        />
      </div>
      {/* Row 2: Feature-specific acceptance rates */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <StatsCard
          title="Contribution Rate — Agent"
          tip="Agent lines changed ÷ total lines changed × 100%"
          description="LOC added and deleted driven by agent"
          value={isLoading ? "..." : `${agentContribRate}%`}
        />
        <StatsCard
          title="Contribution Rate — Non-agent"
          tip="(Total lines changed − agent lines changed) ÷ total lines changed × 100%"
          description="LOC added and deleted driven by non-agent"
          value={isLoading ? "..." : `${nonAgentContribRate}%`}
        />
      </div>
      {/* Row 3: Activity metrics */}
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
