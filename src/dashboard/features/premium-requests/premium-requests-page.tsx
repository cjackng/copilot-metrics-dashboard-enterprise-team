import { ErrorPage } from "../common/error-page";
import { PremiumRequestsTable } from "./charts/premium-requests-table";
import { Header } from "./header";
import { getFeatures } from "@/utils/helpers";
import { cosmosConfiguration } from "@/services/cosmos-db-service";
import { DataProvider } from "./premium-requests-state";
import { getLatestPremiumRequestUsageUpdateTime, getPremiumRequestUsage, IFilter as PremiumRequestUsageServiceFilter } from "@/services/premium-request-usage-service";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface IProps {
  searchParams: PremiumRequestUsageServiceFilter;
}

function getDefaultMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default async function Dashboard(props: IProps) {
  const features = getFeatures();
  const isCosmosDb = cosmosConfiguration();

  if (!features.seats) {
    return <ErrorPage error="Feature not available"></ErrorPage>
  }

  let startDate: Date;
  let endDate: Date;
  let selectedMonth: string;

  const startDateParam = props.searchParams.startDate;
  const endDateParam = props.searchParams.endDate;

  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    endDate = new Date(endDateParam);
    selectedMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
  } else if (props.searchParams.month) {
    selectedMonth = props.searchParams.month;
    const [year, monthNum] = selectedMonth.split('-').map(Number);
    startDate = startOfMonth(new Date(year, monthNum - 1));
    endDate = endOfMonth(new Date(year, monthNum - 1));
  } else {
    selectedMonth = getDefaultMonth();
    const [year, monthNum] = selectedMonth.split('-').map(Number);
    startDate = startOfMonth(new Date(year, monthNum - 1));
    endDate = endOfMonth(new Date(year, monthNum - 1));
  }
  
  const premiumRequestUsagesPromise = getPremiumRequestUsage({ startDate, endDate } as PremiumRequestUsageServiceFilter);
  const latestUpdateTimePromise = getLatestPremiumRequestUsageUpdateTime();
  const [premiumRequestUsages, latestUpdateTime] = await Promise.all([premiumRequestUsagesPromise, latestUpdateTimePromise]);

  if (premiumRequestUsages.status !== "OK") {
    return <ErrorPage error={premiumRequestUsages.errors[0].message} />;
  }

  if (latestUpdateTime.status !== "OK") {
    return <ErrorPage error={latestUpdateTime.errors[0].message} />;
  }

  return (
    <DataProvider 
      premiumRequestUsages={premiumRequestUsages.response}
      latestUpdateTime={latestUpdateTime.response}
      startDate={startDate.toLocaleDateString()} 
      endDate={endDate.toLocaleDateString()}
      selectedMonth={selectedMonth} 
    >
      <main className="flex flex-1 flex-col gap-4 md:gap-8 pb-8">
        <Header isCosmosDb={isCosmosDb} />
        <div className="mx-auto w-full max-w-6xl container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <PremiumRequestsTable />
          </div>
        </div>
      </main>
    </DataProvider>
  );
}