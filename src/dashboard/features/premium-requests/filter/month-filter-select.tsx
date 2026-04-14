"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface MonthFilterSelectProps {
  onMonthChange: (month: string) => void;
  defaultMonth?: string;
  disabled?: boolean;
}

const getMonthOptions = () => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = format(date, "MMM yyyy");
    options.push({ value, label });
  }
  
  return options;
};

export const MonthFilterSelect = ({ onMonthChange, defaultMonth, disabled }: MonthFilterSelectProps) => {
  const searchParams = useSearchParams();
  const currentMonthParam = searchParams.get('month');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthParam || defaultMonth);
  const monthOptions = getMonthOptions();

  useEffect(() => {
    const newMonth = currentMonthParam || defaultMonth;
    setSelectedMonth(newMonth);
  }, [currentMonthParam, defaultMonth]);

  const handleChange = (value: string) => {
    setSelectedMonth(value);
    onMonthChange(value);
  };

  return (
    <Select value={selectedMonth} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {monthOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};