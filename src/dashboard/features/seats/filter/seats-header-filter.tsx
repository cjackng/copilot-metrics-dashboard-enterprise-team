"use client";

import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { seatsStore, useSeats } from "../seats-state";
import { DropdownFilter } from "@/features/dashboard/filter/dropdown-filter";
import { SeatDateFilter } from "./seat-date-filter";

export function SeatsHeaderFilter() {
  const { teams } = useSeats();
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasDateFilter = searchParams.has("date");
  const hasTeamFilter = teams.some((t) => t.isSelected);
  const isFilterActive = hasDateFilter || hasTeamFilter;

  const handleReset = () => {
    seatsStore.resetTeamFilters();
    router.push("/seats", { scroll: false });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SeatDateFilter />
      <DropdownFilter
        name={"Team"}
        allItems={teams as { value: string; isSelected: boolean }[]}
        onSelect={(e) => seatsStore.filterTeam(e)}
        onBatchSelect={(names, selected) => seatsStore.batchFilterTeams(names, selected)}
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
