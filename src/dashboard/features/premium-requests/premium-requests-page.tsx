import { ErrorPage } from "../common/error-page";
import { PremiumRequestsTable } from "./charts/premium-requests-table";
import { Header } from "./header";
import { getFeatures } from "@/utils/helpers";
import { cosmosConfiguration } from "@/services/cosmos-db-service";
import { getCopilotSeats, IFilter as SeatServiceFilter } from "@/services/copilot-seat-service";
import { DataProvider } from "./premium-requests-state";
import { getPremiumRequestUsage, IFilter as PremiumRequestUsageServiceFilter } from "@/services/premium-request-usage-service";

export interface IProps {
  searchParams: SeatServiceFilter;
}

export default async function Dashboard(props: IProps) {
  const features = getFeatures();
  const isCosmosDb = cosmosConfiguration();

  if (!features.seats) {
    return <ErrorPage error="Feature not available"></ErrorPage>
  }

  const seatsPromise = getCopilotSeats(props.searchParams);
  const premiumRequestUsagesPromise = getPremiumRequestUsage(undefined as unknown as PremiumRequestUsageServiceFilter);
  const [seats, premiumRequestUsages] = await Promise.all([seatsPromise, premiumRequestUsagesPromise]);
  if (seats.status !== "OK") {
    return <ErrorPage error={seats.errors[0].message} />;
  }

  if (premiumRequestUsages.status !== "OK") {
    return <ErrorPage error={premiumRequestUsages.errors[0].message} />;
  }

  return (
    <DataProvider copilotSeats={seats.response} premiumRequestUsages={premiumRequestUsages.response}>
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