"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format, subDays } from "date-fns";
import * as React from "react";
import { DateRange as RdrDateRange, RangeKeyDict } from "react-date-range";
import { parseDate } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface DateFilterProps {
  resetPath?: string;
  /** Restrict calendar to this date or earlier. Defaults to today (no restriction). */
  maxDate?: Date;
}

interface RangeState {
  startDate: Date;
  endDate: Date;
  key: string;
}

export const DashboardDateFilter = ({ resetPath = "/", maxDate = new Date() }: DateFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);
  const [pendingRange, setPendingRange] = React.useState<RangeState | null>(null);

  const buildRange = (): RangeState => {
    const start = parseDate(searchParams.get("startDate")) ?? maxDate;
    const end = parseDate(searchParams.get("endDate")) ?? maxDate;
    return { startDate: start, endDate: end, key: "selection" };
  };

  const [range, setRange] = React.useState<RangeState>(buildRange);

  React.useEffect(() => {
    setRange(buildRange());
    setPendingRange(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleChange = (item: RangeKeyDict) => {
    const sel = item.selection as RangeState;
    setRange(sel);
    setPendingRange(sel);
    // Auto-apply when a full range (start ≠ end) is selected
    if (
      sel.startDate &&
      sel.endDate &&
      sel.startDate.getTime() !== sel.endDate.getTime()
    ) {
      applyRange(sel);
    }
  };

  const applyRange = (r: RangeState) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("startDate", format(r.startDate, "yyyy-MM-dd"));
    params.set("endDate", format(r.endDate, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`, { scroll: false });
    setPendingRange(null);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");
    if (startParam && endParam) {
      const s = parseDate(startParam);
      const e = parseDate(endParam);
      if (s && e) {
        if (startParam === endParam) return format(s, "dd MMM yyyy");
        return `${format(s, "dd MMM yyyy")} – ${format(e, "dd MMM yyyy")}`;
      }
    }
    return "Pick a period";
  };

  const hasSelection = searchParams.has("startDate");
  const isSingleDatePending =
    pendingRange &&
    pendingRange.startDate.getTime() === pendingRange.endDate.getTime();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="dashboard-date"
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !hasSelection && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <RdrDateRange
          ranges={[range]}
          onChange={handleChange}
          moveRangeOnFirstSelection={false}
          months={2}
          direction="horizontal"
          showDateDisplay={false}
          maxDate={maxDate}
        />
        {isSingleDatePending && (
          <div className="flex justify-end px-3 pb-3">
            <Button size="sm" onClick={() => applyRange(pendingRange!)}>
              Apply
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
