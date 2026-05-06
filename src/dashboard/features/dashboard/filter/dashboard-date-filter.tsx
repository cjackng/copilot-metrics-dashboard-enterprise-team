"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import * as React from "react";
import { DateRange as RdrDateRange, RangeKeyDict } from "react-date-range";
import { parseDate } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface DateFilterProps {
  resetPath?: string;
}

interface RangeState {
  startDate: Date;
  endDate: Date;
  key: string;
}

export const DashboardDateFilter = ({ resetPath = "/" }: DateFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);

  const buildRange = (): RangeState => {
    const start = parseDate(searchParams.get("startDate")) ?? new Date();
    const end = parseDate(searchParams.get("endDate")) ?? new Date();
    return { startDate: start, endDate: end, key: "selection" };
  };

  const [range, setRange] = React.useState<RangeState>(buildRange);

  React.useEffect(() => {
    setRange(buildRange());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleChange = (item: RangeKeyDict) => {
    const sel = item.selection as RangeState;
    setRange(sel);
    // Auto-apply and close once both endpoints differ (complete range selected)
    if (
      sel.startDate &&
      sel.endDate &&
      sel.startDate.getTime() !== sel.endDate.getTime()
    ) {
      const params = new URLSearchParams();
      params.set("startDate", format(sel.startDate, "yyyy-MM-dd"));
      params.set("endDate", format(sel.endDate, "yyyy-MM-dd"));
      router.push(`?${params.toString()}`, { scroll: false });
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");
    if (startParam && endParam) {
      const s = parseDate(startParam);
      const e = parseDate(endParam);
      if (s && e) return `${format(s, "dd MMM yyyy")} – ${format(e, "dd MMM yyyy")}`;
    }
    return "Pick a period";
  };

  const hasSelection = searchParams.has("startDate");

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
          maxDate={new Date()}
        />
      </PopoverContent>
    </Popover>
  );
};
