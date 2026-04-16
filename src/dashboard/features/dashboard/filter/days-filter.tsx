"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { dashboardStore, useDashboard } from "../dashboard-state";

const OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 28, label: "Last 28 days" },
] as const;

export type DaysOption = 7 | 14 | 28;
export const DEFAULT_DAYS: DaysOption = 28;

export const DaysFilter = () => {
  const { days } = useDashboard();

  return (
    <Select
      value={String(days)}
      onValueChange={(val) => dashboardStore.onDaysChange(parseInt(val, 10) as DaysOption)}
    >
      <SelectTrigger className="w-[160px] font-normal">
        <Calendar className="mr-2 h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map(({ value, label }) => (
          <SelectItem key={value} value={String(value)}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
