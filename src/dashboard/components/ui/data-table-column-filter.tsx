"use client";

import * as React from "react";
import { Column } from "@tanstack/react-table";
import { CalendarIcon, Check, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";

export type ColumnFilterType = "text" | "number" | "date" | "multiSelect";

export interface NumberRangeFilter {
  min?: number;
  max?: number;
}

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

interface DataTableColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  filterType: ColumnFilterType;
}

function isFilterActive(filterValue: unknown): boolean {
  if (filterValue === undefined || filterValue === null || filterValue === "") return false;
  if (Array.isArray(filterValue)) return filterValue.length > 0;
  if (typeof filterValue === "object") {
    return !Object.values(filterValue as Record<string, unknown>).every(
      (v) => v === undefined || v === null || v === ""
    );
  }
  return true;
}

function ClearButton({ onClear }: { onClear: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-2 text-xs text-muted-foreground"
      onClick={onClear}
    >
      Clear
    </Button>
  );
}

export function DataTableColumnFilter<TData, TValue>({
  column,
  filterType,
}: DataTableColumnFilterProps<TData, TValue>) {
  const filterValue = column.getFilterValue();
  const active = isFilterActive(filterValue);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 relative"
        >
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {active && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-3", filterType === "multiSelect" ? "w-52" : "w-60")} align="start">
        {filterType === "text" && (
          <TextFilter column={column} value={(filterValue as string) ?? ""} />
        )}
        {filterType === "number" && (
          <NumberFilter
            column={column}
            value={(filterValue as NumberRangeFilter) ?? {}}
          />
        )}
        {filterType === "date" && (
          <DateFilter
            column={column}
            value={(filterValue as DateRangeFilter) ?? {}}
          />
        )}
        {filterType === "multiSelect" && (
          <MultiSelectFilter column={column} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function TextFilter<TData, TValue>({
  column,
  value,
}: {
  column: Column<TData, TValue>;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Contains</Label>
        {value && <ClearButton onClear={() => column.setFilterValue(undefined)} />}
      </div>
      <Input
        placeholder="Filter..."
        value={value}
        onChange={(e) =>
          column.setFilterValue(e.target.value || undefined)
        }
        className="h-8"
      />
    </div>
  );
}

function NumberFilter<TData, TValue>({
  column,
  value,
}: {
  column: Column<TData, TValue>;
  value: NumberRangeFilter;
}) {
  const hasValue = value.min !== undefined || value.max !== undefined;
  const update = (field: "min" | "max", raw: string) => {
    const num = raw === "" ? undefined : Number(raw);
    const next = { ...value, [field]: num };
    const isEmpty = next.min === undefined && next.max === undefined;
    column.setFilterValue(isEmpty ? undefined : next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Range</Label>
        {hasValue && <ClearButton onClear={() => column.setFilterValue(undefined)} />}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={value.min ?? ""}
          onChange={(e) => update("min", e.target.value)}
          className="h-8"
        />
        <span className="text-muted-foreground text-xs">–</span>
        <Input
          type="number"
          placeholder="Max"
          value={value.max ?? ""}
          onChange={(e) => update("max", e.target.value)}
          className="h-8"
        />
      </div>
    </div>
  );
}

function DatePickerButton({
  value,
  placeholder,
  onChange,
}: {
  value?: string;
  placeholder: string;
  onChange: (date: string | undefined) => void;
}) {
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 w-full justify-start text-left font-normal text-xs",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
          {selected ? format(selected, "dd MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) =>
            onChange(day ? format(day, "yyyy-MM-dd") : undefined)
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function DateFilter<TData, TValue>({
  column,
  value,
}: {
  column: Column<TData, TValue>;
  value: DateRangeFilter;
}) {
  const hasValue = !!value.from || !!value.to;
  const update = (field: "from" | "to", raw: string | undefined) => {
    const next = { ...value, [field]: raw };
    const isEmpty = !next.from && !next.to;
    column.setFilterValue(isEmpty ? undefined : next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Date range</Label>
        {hasValue && <ClearButton onClear={() => column.setFilterValue(undefined)} />}
      </div>
      <div className="space-y-1.5">
        <DatePickerButton
          value={value.from}
          placeholder="From"
          onChange={(d) => update("from", d)}
        />
        <DatePickerButton
          value={value.to}
          placeholder="To"
          onChange={(d) => update("to", d)}
        />
      </div>
    </div>
  );
}

const UNASSIGNED_LABEL = "(Unassigned)";

function isNullish(value: unknown): boolean {
  return value === null || value === undefined || value === "" || value === "undefined" || value === "null";
}

function MultiSelectFilter<TData, TValue>({
  column,
}: {
  column: Column<TData, TValue>;
}) {
  const isArrayColumn = (column.columnDef.meta as { isArrayColumn?: boolean })?.isArrayColumn;

  const facets = React.useMemo(() => {
    const valueCounts = new Map<string, number>();
    if (!isArrayColumn) {
      const raw = column.getFacetedUniqueValues();
      raw.forEach((count, key) => {
        const label = isNullish(key) ? UNASSIGNED_LABEL : String(key);
        valueCounts.set(label, (valueCounts.get(label) || 0) + count);
      });
    } else {
      column.getFacetedRowModel().rows.forEach((row) => {
        const value = row.getValue(column.id);
        if (Array.isArray(value) && value.length > 0) {
          value.forEach((item) => {
            const label = isNullish(item) ? UNASSIGNED_LABEL : String(item);
            valueCounts.set(label, (valueCounts.get(label) || 0) + 1);
          });
        } else if (Array.isArray(value) && value.length === 0) {
          valueCounts.set(UNASSIGNED_LABEL, (valueCounts.get(UNASSIGNED_LABEL) || 0) + 1);
        } else if (isNullish(value)) {
          valueCounts.set(UNASSIGNED_LABEL, (valueCounts.get(UNASSIGNED_LABEL) || 0) + 1);
        } else {
          const str = String(value);
          valueCounts.set(str, (valueCounts.get(str) || 0) + 1);
        }
      });
    }
    return valueCounts;
  }, [column, isArrayColumn]);

  const selectedValues = new Set((column.getFilterValue() as string[]) ?? []);
  const allValues = Array.from(facets ?? []).sort(([a], [b]) => {
    // Keep (Unassigned) at the end
    if (a === UNASSIGNED_LABEL) return 1;
    if (b === UNASSIGNED_LABEL) return -1;
    return String(a).localeCompare(String(b));
  });
  const allSelected = allValues.length > 0 && selectedValues.size === allValues.length;
  const someSelected = selectedValues.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(allValues.map(([v]) => String(v)));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Select</Label>
        {selectedValues.size > 0 && <ClearButton onClear={() => column.setFilterValue(undefined)} />}
      </div>
      <Command className="border rounded-md">
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem onSelect={toggleAll}>
              <div className={cn(
                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                allSelected ? "bg-primary text-primary-foreground" : someSelected ? "bg-primary/50 text-primary-foreground" : "opacity-50 [&_svg]:invisible"
              )}>
                <Check className="h-3 w-3" />
              </div>
              <span className="font-medium">Select all</span>
            </CommandItem>
            {allValues.map(([value, count]) => {
              const strValue = String(value);
              const isSelected = selectedValues.has(strValue);
              return (
                <CommandItem
                  key={strValue}
                  onSelect={() => {
                    const next = new Set(selectedValues);
                    if (isSelected) {
                      next.delete(strValue);
                    } else {
                      next.add(strValue);
                    }
                    const arr = Array.from(next);
                    column.setFilterValue(arr.length ? arr : undefined);
                  }}
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                  )}>
                    <Check className="h-3 w-3" />
                  </div>
                  <span className={cn("truncate", strValue === UNASSIGNED_LABEL && "italic text-muted-foreground")}>{strValue}</span>
                  {count !== undefined && (
                    <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                      {count}
                    </span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

// Custom filter functions

export const numberRangeFilterFn = <TData,>(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: NumberRangeFilter
): boolean => {
  if (!filterValue) return true;
  const raw = row.getValue(columnId);
  if (raw === null || raw === undefined) return false;
  const val = Number(raw);
  if (isNaN(val)) return false;
  if (filterValue.min !== undefined && val < filterValue.min) return false;
  if (filterValue.max !== undefined && val > filterValue.max) return false;
  return true;
};
numberRangeFilterFn.autoRemove = (val: NumberRangeFilter) =>
  !val || (val.min === undefined && val.max === undefined);

export const dateRangeFilterFn = <TData,>(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: DateRangeFilter
): boolean => {
  if (!filterValue) return true;
  const raw = row.getValue(columnId);
  if (!raw) return false;
  const dateStr = String(raw).slice(0, 10);
  if (filterValue.from && dateStr < filterValue.from) return false;
  if (filterValue.to && dateStr > filterValue.to) return false;
  return true;
};
dateRangeFilterFn.autoRemove = (val: DateRangeFilter) =>
  !val || (!val.from && !val.to);

export const multiSelectFilterFn = <TData,>(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: string[]
): boolean => {
  if (!filterValue || filterValue.length === 0) return true;
  const raw = row.getValue(columnId);
  const isNull = raw === null || raw === undefined || raw === "" || raw === "undefined" || raw === "null";
  if (isNull) return filterValue.includes(UNASSIGNED_LABEL);
  return filterValue.includes(String(raw));
};
multiSelectFilterFn.autoRemove = (val: string[]) =>
  !val || val.length === 0;
