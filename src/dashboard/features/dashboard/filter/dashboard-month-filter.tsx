"use client";

import { format, parseISO } from "date-fns";
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

/** Returns "YYYY-MM" if startDate/endDate span exactly one full calendar month, else null. */
const detectSelectedMonth = (startDate: string | null, endDate: string | null): string | null => {
  if (!startDate || !endDate) return null;
  try {
    const from = parseISO(startDate);
    const to = parseISO(endDate);
    if (from.getDate() !== 1) return null;
    const lastDay = new Date(from.getFullYear(), from.getMonth() + 1, 0);
    if (
      to.getDate() === lastDay.getDate() &&
      to.getMonth() === from.getMonth() &&
      to.getFullYear() === from.getFullYear()
    ) {
      return `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;
    }
    return null;
  } catch {
    return null;
  }
};

export const DashboardMonthFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedMonth = detectSelectedMonth(
    searchParams.get("startDate"),
    searchParams.get("endDate"),
  );
  const monthOptions = getMonthOptions();

  const handleMonthChange = (monthValue: string) => {
    const [year, month] = monthValue.split("-").map(Number);
    const startDate = format(new Date(year, month - 1, 1), "yyyy-MM-dd");
    const endDate = format(new Date(year, month, 0), "yyyy-MM-dd");
    const params = new URLSearchParams();
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
