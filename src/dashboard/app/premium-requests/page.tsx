import Dashboard, { IProps } from "@/features/premium-requests/premium-requests-page";
import { Suspense } from "react";
import Loading from "./loading";
import { Metadata } from 'next';
import { format, startOfMonth, endOfMonth } from "date-fns";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "GitHub Copilot Premium Requests Dashboard",
  description: "GitHub Copilot Premium Requests Dashboard",
};
export const dynamic = "force-dynamic";
export default function Home(props: IProps) {
  const today = new Date();
  const defaultStart = format(startOfMonth(today), "yyyy-MM-dd");
  const defaultEnd = format(endOfMonth(today), "yyyy-MM-dd");

  if (!props.searchParams.startDate) {
    redirect(`/premium-requests?startDate=${defaultStart}&endDate=${defaultEnd}`);
  }

  const startDate = String(props.searchParams.startDate);
  const endDate = props.searchParams.endDate ? String(props.searchParams.endDate) : defaultEnd;
  const id = `premium-requests-${startDate}-${endDate}`;

  return (
    <Suspense fallback={<Loading />} key={id}>
      <Dashboard {...props} />
    </Suspense>
  );
}
