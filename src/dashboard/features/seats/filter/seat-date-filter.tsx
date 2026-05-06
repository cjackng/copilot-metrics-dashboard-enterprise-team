"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import * as React from "react";
import { parseDate } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface SeatDateFilterProps {
  resetPath?: string;
}

export const SeatDateFilter = ({ resetPath = "/seats" }: SeatDateFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getInitialDate = (): Date | undefined => {
    const param = searchParams.get("date");
    if (param) {
      const d = parseDate(param);
      return d ?? undefined;
    }
    return undefined;
  };

  const [date, setDate] = React.useState<Date | undefined>(getInitialDate);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(getInitialDate());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyFilter = (selected: Date | undefined) => {
    setDate(selected);
    if (selected) {
      const params = new URLSearchParams();
      params.set("date", format(selected, "yyyy-MM-dd"));
      router.push(`?${params.toString()}`, { scroll: false });
    } else {
      router.push(resetPath, { scroll: false });
    }
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (date) return format(date, "dd MMM yyyy");
    return "Pick a date";
  };

  return (
    <div className={cn("grid gap-2")}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="seat-date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDisplayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            selected={date}
            onSelect={applyFilter}
            disabled={(d) => d > new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
