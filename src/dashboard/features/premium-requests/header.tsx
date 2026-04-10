"use client";

import { PageHeader, PageTitle } from "../page-header/page-header";
import { DateFilter } from "./filter/date-filter";
import { MonthFilterSelect } from "./filter/month-filter-select";
import { useDashboard } from "./premium-requests-state";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface HeaderProps {
  isCosmosDb?: boolean;
}

export const Header = ({ isCosmosDb }: HeaderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { selectedMonth } = useDashboard();

  const hasDateFilter = searchParams.has('startDate') && searchParams.has('endDate');

  const handleMonthChange = (month: string) => {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("month", month);
      router.push(`/premium-requests?${params.toString()}`);
    });
  };

  return (
    <PageHeader>
      <PageTitle>Premium Requests Usage</PageTitle>
      <div className="flex items-center gap-2">
        <MonthFilterSelect 
          onMonthChange={handleMonthChange} 
          defaultMonth={selectedMonth}
          disabled={hasDateFilter}
        />
        <DateFilter limited={true} />
      </div>
    </PageHeader>
  );
};
