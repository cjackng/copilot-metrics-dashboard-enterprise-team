"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eraser, InfoIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { seatsStore, useSeats } from "../seats-state";
import { DropdownFilter } from "@/features/dashboard/filter/dropdown-filter";
import { SeatDateFilter } from "./seat-date-filter";
import { SEATS_MIN_DATE } from "@/config/data-availability";

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

  const snapshotTooltip = `Current snapshot captured at: ${formattedSnapshotTime}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SeatDateFilter minDate={SEATS_MIN_DATE} />
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
      {formattedLastUpdated && (
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground">Data last updated: {formattedLastUpdated}</p>
          {snapshotTooltip && (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground p-3 max-w-[320px] border">
                  <p className="text-sm leading-relaxed">{snapshotTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
}