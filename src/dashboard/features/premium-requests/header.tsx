"use client";

import { PageHeader, PageTitle } from "../page-header/page-header";
import { useRouter, useSearchParams } from "next/navigation";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardMonthFilter } from "@/features/dashboard/filter/dashboard-month-filter";
import { DashboardDateFilter } from "@/features/dashboard/filter/dashboard-date-filter";
import { DropdownFilter } from "@/features/dashboard/filter/dropdown-filter";
import { dashboardStore, useDashboard } from "./premium-requests-state";

export const Header = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { teams } = useDashboard();

  const hasDateFilter = searchParams.has("startDate");
  const hasTeamFilter = teams.some((t) => t.isSelected);
  const isFilterActive = hasDateFilter || hasTeamFilter;

  const handleReset = () => {
    dashboardStore.resetTeamFilters();
    router.push("/premium-requests", { scroll: false });
  };

  return (
    <PageHeader>
      <PageTitle>Premium Requests Usage</PageTitle>
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
    </PageHeader>
  );
};

