import { ErrorPage } from "../common/error-page";
import { PremiumRequestsTable } from "./charts/premium-requests-table";
import { Header } from "./header";
import { getFeatures } from "@/utils/helpers";
import { DataProvider } from "./premium-requests-state";
import { getLatestPremiumRequestUsageUpdateTime, getPremiumRequestUsage, IFilter as PremiumRequestUsageServiceFilter } from "@/services/premium-request-usage-service";
import { startOfMonth, endOfMonth, differenceInCalendarMonths, format, parse } from "date-fns";

export interface IProps {
  searchParams: PremiumRequestUsageServiceFilter;
}

export default async function Dashboard(props: IProps) {
  const features = getFeatures();

  if (!features.seats) {
    return <ErrorPage error="Feature not available"></ErrorPage>
  }

  let startDate: Date;
  let endDate: Date;
  let selectedMonth: string;

  const startDateParam = props.searchParams.startDate;
  const endDateParam = props.searchParams.endDate;
  const selectedMonthParam = props.searchParams.month;

  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    endDate = new Date(endDateParam);
    selectedMonth = format(startDate, "yyyy-MM");
  } else if (selectedMonthParam) {
    selectedMonth = selectedMonthParam;
    const monthDate = parse(selectedMonthParam, "yyyy-MM", new Date());
    startDate = startOfMonth(monthDate);
    endDate = endOfMonth(monthDate);
  } else {
    const today = new Date();
    selectedMonth = format(today, "yyyy-MM");
    startDate = startOfMonth(today);
    endDate = endOfMonth(today);
  }
  const isCrossMonthRange = differenceInCalendarMonths(endDate, startDate) > 0;
  const [premiumRequestUsages, latestUpdateTime] = await Promise.all(
    [
      getPremiumRequestUsage({ startDate, endDate } as PremiumRequestUsageServiceFilter), 
      getLatestPremiumRequestUsageUpdateTime()
    ]);

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
      isCrossMonthRange={isCrossMonthRange}
    >
      <main className="flex flex-1 flex-col gap-4 md:gap-8 pb-8">
        <Header />
        <div className="mx-auto w-full max-w-6xl container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <PremiumRequestsTable />
          </div>
        </div>
      </main>
    </DataProvider>
  );
}