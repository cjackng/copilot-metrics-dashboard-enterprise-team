import Dashboard, { IProps } from "@/features/premium-requests/premium-requests-page";
import { Suspense } from "react";
import Loading from "./loading";
import { Metadata } from 'next';
 
export const metadata: Metadata = {
  title: "GitHub Copilot Premium Requests Dashboard",
  description: "GitHub Copilot Premium Requests Dashboard",
};
export const dynamic = "force-dynamic";
export default function Home(props: IProps) {

  let id = "initial-premium-requests-dashboard";

  if (props.searchParams.date ) {
    id = `${id}-${props.searchParams.date}`;
  }

  return (
    <Suspense fallback={<Loading />} key={id}>
      <Dashboard {...props} />
    </Suspense>
  );
}
