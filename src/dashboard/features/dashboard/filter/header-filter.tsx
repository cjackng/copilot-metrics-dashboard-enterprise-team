"use client";

import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";
import { format, startOfMonth, subDays } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { dashboardStore, useDashboard } from "../dashboard-state";
import { DropdownFilter } from "./dropdown-filter";
import { DashboardMonthFilter } from "./dashboard-month-filter";
import { DashboardDateFilter } from "./dashboard-date-filter";
import { DASHBOARD_MIN_DATE } from "@/config/data-availability";

export function Filters() {
  const { teams: allTeams, isLoading } = useDashboard();
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = new Date();
  const maxDate = subDays(today, 2);
  const defaultStart = format(startOfMonth(maxDate), "yyyy-MM-dd");
  const defaultEnd = format(maxDate, "yyyy-MM-dd");

  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const isDefaultDates = startDate === defaultStart && endDate === defaultEnd;

  const hasTeamFilter = allTeams.some((t) => t.isSelected);
  const isFilterActive = !isDefaultDates || hasTeamFilter;

  const handleReset = () => {
    dashboardStore.resetAllFilters();
    router.push("/", { scroll: false });
  };

  return (
    <div className="flex gap-2 flex-1 flex-wrap">
      <DashboardMonthFilter maxDate={maxDate} minDate={DASHBOARD_MIN_DATE} />
      <DashboardDateFilter maxDate={maxDate} minDate={DASHBOARD_MIN_DATE} />
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
