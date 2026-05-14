"use client";

import { format, parseISO, subDays, min, max, endOfMonth, startOfMonth } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getMonthOptions = (minDate?: Date) => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Skip months whose entire month ends before minDate (no data available)
    if (minDate && endOfMonth(date) < minDate) break;
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: format(date, "MMM yyyy") });
  }
  return options;
};

interface DashboardMonthFilterProps {
  /** Restrict end date to this date or earlier. Defaults to today (no restriction). */
  maxDate?: Date;
  /** Restrict start date to this date or later (earliest available data). */
  minDate?: Date;
}

/** Returns "YYYY-MM" if startDate/endDate span exactly one full calendar month (respecting maxDate cap and minDate floor), else null. */
const detectSelectedMonth = (startDate: string | null, endDate: string | null, maxDate: Date, minDate?: Date): string | null => {
  if (!startDate || !endDate) return null;
  try {
    const from = parseISO(startDate);
    const monthStart = startOfMonth(from);
    const naturalEnd = endOfMonth(monthStart);
    const cappedStart = minDate ? max([monthStart, minDate]) : monthStart;
    const cappedEnd = min([naturalEnd, maxDate]);
    const to = parseISO(endDate);
    if (
      from.getDate() === cappedStart.getDate() &&
      from.getMonth() === cappedStart.getMonth() &&
      from.getFullYear() === cappedStart.getFullYear() &&
      to.getDate() === cappedEnd.getDate() &&
      to.getMonth() === cappedEnd.getMonth() &&
      to.getFullYear() === cappedEnd.getFullYear()
    ) {
      return `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;
    }
    return null;
  } catch {
    return null;
  }
};

export const DashboardMonthFilter = ({ maxDate = new Date(), minDate }: DashboardMonthFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedMonth = detectSelectedMonth(
    searchParams.get("startDate"),
    searchParams.get("endDate"),
    maxDate,
    minDate,
  );
  const monthOptions = getMonthOptions(minDate);

  const handleMonthChange = (monthValue: string) => {
    const [year, month] = monthValue.split("-").map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const naturalEnd = endOfMonth(monthStart);
    const cappedStart = minDate ? max([monthStart, minDate]) : monthStart;
    const cappedEnd = min([naturalEnd, maxDate]);
    const startDate = format(cappedStart, "yyyy-MM-dd");
    const endDate = format(cappedEnd, "yyyy-MM-dd");
    const params = new URLSearchParams(searchParams.toString());
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Select value={selectedMonth ?? ""} onValueChange={handleMonthChange}>
      <SelectTrigger className="w-[150px] font-normal">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {monthOptions.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
