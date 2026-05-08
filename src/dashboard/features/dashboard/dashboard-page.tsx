import { ErrorPage } from "../common/error-page";
import { AvgChatRequestsPerActiveUser } from "./charts/avg-chat-requests-per-active-user";
import { CodeCompletionsAcceptanceRate } from "./charts/code-completions-acceptance-rate";
import { RequestsPerChatMode } from "./charts/requests-per-chat-mode";
import { ActiveUsers } from "./charts/active-users";
import { Stats } from "./charts/stats";
import { CodeCompletions } from "./charts/code-completions";
import { UserInitiatedCodeChanges } from "./charts/user-initiated-code-changes";
import { AgentInitiatedCodeChanges } from "./charts/agent-initiated-code-changes";
import { DailyLinesAddedDeleted } from "./charts/daily-lines-added-deleted";
import { DataProvider } from "./dashboard-state";

import { Header } from "./header";
import { getCopilotMetrics, getMetricsLastUpdated, IFilter as MetricsFilter } from "@/services/copilot-metrics-service";
import { getAllEnterpriseMembersLookup } from "@/services/enterprise-members-service";
import { format, startOfMonth, endOfMonth } from "date-fns";

export interface IProps {
  searchParams: MetricsFilter;
}

export default async function Dashboard(props: IProps) {
  const today = new Date();
  const startDate = props.searchParams.startDate
    ? String(props.searchParams.startDate)
    : format(startOfMonth(today), "yyyy-MM-dd");
  const endDate = props.searchParams.endDate
    ? String(props.searchParams.endDate)
    : format(endOfMonth(today), "yyyy-MM-dd");

  const metricsFilter = { ...props.searchParams, startDate, endDate };

  const metricsPromise = getCopilotMetrics(metricsFilter);
  const memberTeamsPromise = getAllEnterpriseMembersLookup();
  const lastUpdatedPromise = getMetricsLastUpdated();

  const [metrics, membersToTeams, lastUpdated] = await Promise.all([
    metricsPromise,
    memberTeamsPromise,
    lastUpdatedPromise,
  ]);

  if (metrics.status !== "OK") {
    return <ErrorPage error={metrics.errors[0].message} />;
  }

  const enterpriseTeams = membersToTeams.teams;
  const lastUpdatedTime = lastUpdated ? lastUpdated.toISOString() : null;

  return (
    <DataProvider
      copilotUsages={metrics.response}
      memberTeamsData={membersToTeams.memberMap}
      enterpriseTeams={enterpriseTeams}
      lastUpdatedTime={lastUpdatedTime}
      filter={{
        startDate,
        endDate,
        enterprise: props.searchParams.enterprise,
        organization: props.searchParams.organization,
      }}
    >
      <main className="flex flex-1 flex-col gap-4 md:gap-4 pb-8">
        <Header />
        <div className="mx-auto w-full max-w-6xl container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Stats />
            <ActiveUsers />
            <DailyLinesAddedDeleted />
            <div className="grid grid-cols-1 md:grid-cols-2 col-span-4 gap-6">
              <UserInitiatedCodeChanges />
              <AgentInitiatedCodeChanges />
            </div>
            <AvgChatRequestsPerActiveUser />
            <RequestsPerChatMode />
            {/* <TotalCodeLineSuggestionsAndAcceptances /> */}
            <div className="grid grid-cols-1 md:grid-cols-2 col-span-4 gap-6">
              <CodeCompletions />
              <CodeCompletionsAcceptanceRate />
            </div>
            {/* <TotalChatsAndAcceptances /> */}
          </div>
        </div>
      </main>
    </DataProvider>
  );
}
