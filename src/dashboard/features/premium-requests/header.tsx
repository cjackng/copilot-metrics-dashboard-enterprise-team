"use client";

import { PageHeader, PageTitle } from "../page-header/page-header";
import { useRouter, useSearchParams } from "next/navigation";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, parseISO } from "date-fns";
import { DashboardMonthFilter } from "@/features/dashboard/filter/dashboard-month-filter";
import { DashboardDateFilter } from "@/features/dashboard/filter/dashboard-date-filter";
import { DropdownFilter } from "@/features/dashboard/filter/dropdown-filter";
import { dashboardStore, useDashboard } from "./premium-requests-state";

export const Header = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { teams, latestUpdateTime } = useDashboard();

  const today = new Date();
  const defaultStart = format(startOfMonth(today), "yyyy-MM-dd");
  const defaultEnd = format(today, "yyyy-MM-dd");

  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const isDefaultDates = startDate === defaultStart && endDate === defaultEnd;

  const hasTeamFilter = teams.some((t) => t.isSelected);
  const isFilterActive = !isDefaultDates || hasTeamFilter;

  const formattedLastUpdated = latestUpdateTime
    ? format(
        latestUpdateTime instanceof Date ? latestUpdateTime : parseISO(String(latestUpdateTime)),
        "dd MMM yyyy HH:mm",
      )
    : null;

  const handleReset = () => {
    dashboardStore.resetTeamFilters();
    router.push("/premium-requests", { scroll: false });
  };

  return (
    <PageHeader>
      <PageTitle>Premium Requests</PageTitle>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <DashboardMonthFilter />
          <DashboardDateFilter resetPath="/premium-requests" />
          <DropdownFilter
            name={"Team"}
            allItems={teams as { value: string; isSelected: boolean }[]}
            onSelect={(e) => dashboardStore.filterTeam(e)}
            onBatchSelect={(names, selected) => dashboardStore.batchFilterTeams(names, selected)}
          />
          {isFilterActive && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <Eraser size={16} className="mr-1" />
              Reset
            </Button>
          )}
        </div>
        {formattedLastUpdated && (
          <p className="text-xs text-muted-foreground">Data last updated: {formattedLastUpdated}</p>
        )}
      </div>
    </PageHeader>
  );
};

