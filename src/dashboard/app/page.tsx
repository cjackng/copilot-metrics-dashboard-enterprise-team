import Dashboard, { IProps } from "@/features/dashboard/dashboard-page";
import { Suspense } from "react";
import Loading from "./loading";
import { format, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";
export default function Home(props: IProps) {
  const today = new Date();
  const defaultStart = format(startOfMonth(today), "yyyy-MM-dd");
  const defaultEnd = format(endOfMonth(today), "yyyy-MM-dd");

  const startDate = props.searchParams.startDate ? String(props.searchParams.startDate) : defaultStart;
  const endDate = props.searchParams.endDate ? String(props.searchParams.endDate) : defaultEnd;

  const id = `dashboard-${startDate}-${endDate}`;

  return (
    <Suspense fallback={<Loading />} key={id}>
      <Dashboard {...props} />
    </Suspense>
  );
}
