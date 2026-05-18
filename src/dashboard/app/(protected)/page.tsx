import Dashboard, { IProps } from "@/features/dashboard/dashboard-page";
import { Suspense } from "react";
import Loading from "./loading";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default function Home(props: IProps) {
  const today = new Date();
  // To ensure data availability (2 days delay), set default end date to 2 days ago.
  const maxDate = subDays(today, 2);
  const defaultStart = format(startOfMonth(maxDate), "yyyy-MM-dd");
  const defaultEnd = format(maxDate, "yyyy-MM-dd");

  if (!props.searchParams.startDate) {
    redirect(`/?startDate=${defaultStart}&endDate=${defaultEnd}`);
  }

  const startDate = String(props.searchParams.startDate);
  const endDate = props.searchParams.endDate ? String(props.searchParams.endDate) : defaultEnd;
  const id = `dashboard-${startDate}-${endDate}`;

  return (
    <Suspense fallback={<Loading />} key={id}>
      <Dashboard {...props} />
    </Suspense>
  );
}
