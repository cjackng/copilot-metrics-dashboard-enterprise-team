"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import * as React from "react";
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
}

export const DateFilter = ({ limited = false }: DateFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date();

  const getInitialDateRange = (): Date | undefined => {
    const selectedDate = searchParams.get('date');
    if (selectedDate) {
      const parsed = parseDate(selectedDate);
      return parsed || undefined;
    }
    return undefined;
  };

  const [date, setDate] = React.useState<Date | undefined>(getInitialDateRange());
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(getInitialDateRange());
  }, [searchParams]);

  const applyFilters = () => {
    if (date) {
      const formatDate = format(date, "yyyy-MM-dd");

      router.push(`?date=${formatDate}`, {
        scroll: false,
      });
      router.refresh();
      setIsOpen(false);
    }
  };

  const resetFilters = () => {    
    router.push(`/`, {
      scroll: false,
    });
    router.refresh();
    setIsOpen(false);
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
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              format(date, "LLL dd, y")
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 flex gap-2 flex-col"
          align="start"
        >
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={date}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
            disabled={limited ? { after: new Date(today.getTime()) } : undefined}
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
