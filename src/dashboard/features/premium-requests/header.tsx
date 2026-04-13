"use client";

import { PageHeader, PageTitle } from "../page-header/page-header";
import { DateFilter } from "./filter/date-filter";
import { MonthFilterSelect } from "./filter/month-filter-select";
import { useDashboard } from "./premium-requests-state";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  isCosmosDb?: boolean;
}

export const Header = ({ isCosmosDb }: HeaderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { selectedMonth } = useDashboard();

  const hasDateFilter = searchParams.has('startDate') && searchParams.has('endDate');
  const hasMonthFilter = searchParams.has('month');
  const hasActiveFilter = hasDateFilter || hasMonthFilter;

  const handleMonthChange = (month: string) => {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("month", month);
      router.push(`/premium-requests?${params.toString()}`);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(`/premium-requests`);
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
        <DateFilter limited={false} disabled={hasMonthFilter} />
        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </PageHeader>
  );
};
