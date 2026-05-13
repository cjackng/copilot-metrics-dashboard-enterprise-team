"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import * as React from "react";
import { Calendar as RdrCalendar } from "react-date-range";
import { parseDate } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

export const SeatDateFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getDate = (): Date =>
    parseDate(searchParams.get("date")) ?? new Date();

  const [date, setDate] = React.useState<Date>(getDate);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(getDate());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSelect = (selected: Date) => {
    setDate(selected);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(selected, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const hasSelection = searchParams.has("date");
  const displayText = hasSelection
    ? format(date, "dd MMM yyyy")
    : "Pick a date";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="seat-date"
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !hasSelection && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <RdrCalendar
          date={date}
          onChange={handleSelect}
          maxDate={new Date()}
        />
      </PopoverContent>
    </Popover>
  );
};
