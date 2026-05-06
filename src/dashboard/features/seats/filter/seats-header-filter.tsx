"use client";

import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { seatsStore, useSeats } from "../seats-state";
import { DropdownFilter } from "@/features/dashboard/filter/dropdown-filter";
import { SeatDateFilter } from "./seat-date-filter";

export function SeatsHeaderFilter() {
  const { teams, last_update_time, snapshot_time, snapshot_date, selectedDate } = useSeats();
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasDateFilter = searchParams.has("date");
  const hasTeamFilter = teams.some((t) => t.isSelected);
  const isFilterActive = hasDateFilter || hasTeamFilter;

  const handleReset = () => {
    seatsStore.resetTeamFilters();
    router.push("/seats", { scroll: false });
  };

  const fmt = (d: Date | string | null) =>
    d ? format(d instanceof Date ? d : parseISO(String(d)), "dd MMM yyyy HH:mm") : null;

  const formattedLastUpdated = fmt(last_update_time);
  const formattedSnapshotTime = fmt(snapshot_time);
  const isStaleSnapshot = snapshot_date && selectedDate && snapshot_date !== selectedDate;

  return (
    <div className="flex flex-col gap-4">
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
      <div className="flex flex-row gap-10">
        {formattedLastUpdated && (
          <p className="text-xs text-muted-foreground">Data last updated: {formattedLastUpdated}</p>
        )}
        {formattedSnapshotTime && (
          <p className="text-xs text-muted-foreground">
            {isStaleSnapshot
              ? `No snapshot for ${selectedDate}. Showing nearest prior snapshot captured at: ${formattedSnapshotTime}`
              : `Snapshot from: ${formattedSnapshotTime}`}
          </p>
        )}
      </div>
    </div>
  );
}
