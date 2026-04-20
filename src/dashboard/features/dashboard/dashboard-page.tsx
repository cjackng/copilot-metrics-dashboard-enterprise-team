import { ErrorPage } from "../common/error-page";
import { AcceptanceRate } from "./charts/acceptance-rate";
import { ChatAcceptanceRate } from "./charts/chat-acceptance-rate";
import { ActiveUsers } from "./charts/active-users";
import { Stats } from "./charts/stats";
import { TotalChatsAndAcceptances } from "./charts/total-chat-suggestions-and-acceptances";
import { TotalCodeLineSuggestionsAndAcceptances } from "./charts/total-code-line-suggestions-and-acceptances";
import { TotalSuggestionsAndAcceptances } from "./charts/total-suggestions-and-acceptances";
import { DataProvider } from "./dashboard-state";
import { TimeFrameToggle } from "./filter/time-frame-toggle";
import { Header } from "./header";
import { getCopilotMetrics, IFilter as MetricsFilter } from "@/services/copilot-metrics-service";
import { getAllEnterpriseMembersLookup } from "@/services/enterprise-members-service";
import { getCopilotSeatsManagement, IFilter as SeatServiceFilter } from "@/services/copilot-seat-service";
import { refreshEnterpriseTeamsData } from "@/services/dashboard-actions";

export interface IProps {
  searchParams: MetricsFilter;
}

export default async function Dashboard(props: IProps) {
  const metricsFilter = props.searchParams;

  const metricsPromise = getCopilotMetrics(metricsFilter);
  const seatsPromise = getCopilotSeatsManagement({
    date: props.searchParams.endDate,
  } as SeatServiceFilter);
  const memberTeamsPromise = getAllEnterpriseMembersLookup();
  const enterpriseTeamsPromise = refreshEnterpriseTeamsData();
  const [metrics, seats, membersToTeams, enterpriseTeamsResult] = await Promise.all([
    metricsPromise,
    seatsPromise,
    memberTeamsPromise,
    enterpriseTeamsPromise,
  ]);

  if (metrics.status !== "OK") {
    return <ErrorPage error={metrics.errors[0].message} />;
  }

  if (seats.status !== "OK") {
    return <ErrorPage error={seats.errors[0].message} />;
  }

  const enterpriseTeams = enterpriseTeamsResult.success && enterpriseTeamsResult.data
    ? enterpriseTeamsResult.data
    : [];

  return (
    <DataProvider
      copilotUsages={metrics.response}
      seatsData={seats.response}
      memberTeamsData={membersToTeams.memberMap}
      enterpriseTeams={enterpriseTeams}
      filter={{
        startDate: props.searchParams.startDate,
        endDate: props.searchParams.endDate,
        enterprise: props.searchParams.enterprise,
        organization: props.searchParams.organization,
      }}
    >
      <main className="flex flex-1 flex-col gap-4 md:gap-8 pb-8">
        <Header />
        <div className="mx-auto w-full max-w-6xl container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Stats />
            <div className="flex justify-end col-span-4">
              <TimeFrameToggle />
            </div>
            <ActiveUsers />
            <AcceptanceRate />
            <ChatAcceptanceRate />
            {/* <TotalCodeLineSuggestionsAndAcceptances /> */}
            <TotalSuggestionsAndAcceptances />
            {/* <TotalChatsAndAcceptances /> */}
          </div>
        </div>
      </main>
    </DataProvider>
  );
}
