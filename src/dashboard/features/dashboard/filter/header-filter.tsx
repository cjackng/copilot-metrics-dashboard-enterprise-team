"use client";

import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { dashboardStore, useDashboard } from "../dashboard-state";
import { DropdownFilter } from "./dropdown-filter";
import { DashboardMonthFilter } from "./dashboard-month-filter";
import { DashboardDateFilter } from "./dashboard-date-filter";

export function Filters() {
  const { teams: allTeams, isLoading } = useDashboard();
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasDateFilter = searchParams.has("startDate");
  const hasTeamFilter = allTeams.some((t) => t.isSelected);
  const isFilterActive = hasDateFilter || hasTeamFilter;

  const handleReset = () => {
    dashboardStore.resetAllFilters();
    router.push("/", { scroll: false });
  };

  return (
    <div className="flex gap-2 flex-1 flex-wrap">
      <DashboardMonthFilter />
      <DashboardDateFilter />
      <DropdownFilter
        name={"Team"}
        allItems={allTeams}
        isLoading={isLoading}
        onSelect={(e) => dashboardStore.filterTeam(e)}
        onBatchSelect={(names, selected) => dashboardStore.batchFilterTeams(names, selected)}
        onClose={() => dashboardStore.refreshTeamDataIfNeeded()}
      />
      {isFilterActive && (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <Eraser size={16} className="mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}
