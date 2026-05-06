import { ErrorPage } from "../common/error-page";
import { SeatsList } from "./seats-list";
import { DataProvider } from "./seats-state";
import { Header } from "./header";
import { Stats } from "./stats/stats";
import { getFeatures } from "@/utils/helpers";
import { getSeatsFromDB } from "@/services/copilot-seat-service";
import { format } from "date-fns";

export interface IProps {
  searchParams: { date?: string };
}

export default async function Dashboard(props: IProps) {
  const features = getFeatures();

  if (!features.seats) {
    return <ErrorPage error="Feature not available" />;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const selectedDate = props.searchParams.date ?? today;

  const result = await getSeatsFromDB(selectedDate);

  if (result.status !== "OK") {
    return <ErrorPage error={result.errors[0].message} />;
  }

  const dbResult = result.response;
  const hasData = dbResult.seats.length > 0;

  if (!hasData) {
    return (
      <main className="flex flex-1 flex-col gap-4 md:gap-4 pb-8">
        <Header title="Seats" />
        <div className="mx-auto w-full max-w-6xl container">
          <div className="flex flex-col items-center justify-center gap-4 h-64 text-muted-foreground">
            <p className="text-lg font-medium">No seat snapshot available for {selectedDate}.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <DataProvider dbResult={dbResult} selectedDate={selectedDate}>
      <main className="flex flex-1 flex-col gap-4 md:gap-4 pb-8">
        <Header title="Seats" />
        <div className="mx-auto w-full max-w-6xl container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Stats />
            <SeatsList />
          </div>
        </div>
      </main>
    </DataProvider>
  );
}
