"use client";

import { format, parseISO, subDays, min, endOfMonth } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getMonthOptions = () => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: format(date, "MMM yyyy") });
  }
  return options;
};

interface DashboardMonthFilterProps {
  /** Restrict end date to this date or earlier. Defaults to today (no restriction). */
  maxDate?: Date;
}

/** Returns "YYYY-MM" if startDate/endDate span exactly one full calendar month (respecting maxDate cap), else null. */
const detectSelectedMonth = (startDate: string | null, endDate: string | null, maxDate: Date): string | null => {
  if (!startDate || !endDate) return null;
  try {
    const from = parseISO(startDate);
    if (from.getDate() !== 1) return null;
    const naturalEnd = endOfMonth(from);
    const cappedEnd = min([naturalEnd, maxDate]);
    const to = parseISO(endDate);
    if (
      to.getDate() === cappedEnd.getDate() &&
      to.getMonth() === cappedEnd.getMonth() &&
      to.getFullYear() === cappedEnd.getFullYear()
    ) {
      return `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;
    }
    return null;
  } catch {
    return null;
  }
};

export const DashboardMonthFilter = ({ maxDate = new Date() }: DashboardMonthFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedMonth = detectSelectedMonth(
    searchParams.get("startDate"),
    searchParams.get("endDate"),
    maxDate,
  );
  const monthOptions = getMonthOptions();

  const handleMonthChange = (monthValue: string) => {
    const [year, month] = monthValue.split("-").map(Number);
    const startDate = format(new Date(year, month - 1, 1), "yyyy-MM-dd");
    const naturalEnd = endOfMonth(new Date(year, month - 1, 1));
    const cappedEnd = min([naturalEnd, maxDate]);
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
