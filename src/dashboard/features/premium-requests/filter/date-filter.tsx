"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import * as React from "react";
import { DateRange } from "react-day-picker";
import { parseDate } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface DateFilterProps {
  limited?: boolean;
  disabled?: boolean;
}

export const DateFilter = ({ limited = false, disabled = false }: DateFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date();
  const defaultDays = limited ? 27 : 31;
  const lastDays = new Date(today);
  lastDays.setDate(today.getDate() - defaultDays);

  const getInitialDateRange = (): DateRange | undefined => {
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    if (startDateParam && endDateParam) {
      const startDate = parseDate(startDateParam);
      const endDate = parseDate(endDateParam);
      if (startDate && endDate) {
        return { from: startDate, to: endDate };
      }
    }
    return undefined;
  };

  const [date, setDate] = React.useState<DateRange | undefined>(getInitialDateRange);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const newDateRange = getInitialDateRange();
    setDate(newDateRange);
  }, [searchParams]);

  const applyFilters = () => {
    if (date?.from && date?.to) {
      const formatEndDate = format(date.to, "yyyy-MM-dd");
      const formatStartDate = format(date.from, "yyyy-MM-dd");

      const params = new URLSearchParams();
      params.set("startDate", formatStartDate);
      params.set("endDate", formatEndDate);

      router.push(`?${params.toString()}`, {
        scroll: false,
      });
      setIsOpen(false);
    }
  };

  const resetFilters = () => {    
    setDate(undefined);
    router.push(`/premium-requests`, {
      scroll: false,
    });
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (date?.from && date?.to) {
      return `${format(date.from, "dd MMM yyyy")} - ${format(date.to, "dd MMM yyyy")}`;
    }
    return "Pick a period";
  };

  return (
    <div className={cn("grid gap-2")}>
      <Popover open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDisplayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 flex gap-2 flex-col"
          align="start"
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            disabled={limited ? { before: new Date(today.getTime() - (27 * 24 * 60 * 60 * 1000)) } : undefined}
          />
          <div className="flex justify-between m-2 gap-2">
            <Button 
              onClick={resetFilters} 
              variant="outline"
            >
              Reset
            </Button>
            <Button onClick={applyFilters}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
