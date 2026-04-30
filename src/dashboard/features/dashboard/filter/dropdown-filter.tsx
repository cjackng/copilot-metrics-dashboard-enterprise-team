"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Sliders, Square, SquareCheck, SquareMinus, Loader2 } from "lucide-react";
import { DropdownFilterItem, useDashboard } from "../dashboard-state";

interface DropdownFilterProps {
  name: string;
  onSelect: (name: string) => void;
  onBatchSelect?: (names: string[], selected: boolean) => void;
  onClose?: () => void;
  allItems: DropdownFilterItem[];
}

export function DropdownFilter(props: DropdownFilterProps) {
  const { name, onSelect, onBatchSelect, onClose, allItems } = props;
  const { isLoading } = useDashboard();
  const [searchText, setSearchText] = useState("");

  const selectedCount = allItems.filter((x) => x.isSelected).length;

  // Compute filtered items matching search
  const filteredItems = useMemo(() => {
    if (!searchText) return allItems;
    const lower = searchText.toLowerCase();
    return allItems.filter((item) => item.value.toLowerCase().includes(lower));
  }, [allItems, searchText]);

  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => item.isSelected);
  const someFilteredSelected =
    filteredItems.some((item) => item.isSelected) && !allFilteredSelected;

  const handleToggleAll = () => {
    if (!onBatchSelect) return;
    const names = filteredItems.map((item) => item.value);
    onBatchSelect(names, !allFilteredSelected);
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover
        onOpenChange={(open) => {
          if (!open) {
            setSearchText("");
            onClose?.();
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className="space-x-2 font-normal"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sliders size={16} />
            )}
            <span> {name}</span>
            <Badge variant={"secondary"}>
              {selectedCount}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput onValueChange={setSearchText} />
            {onBatchSelect && (
              <div
                className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent border-b"
                onClick={handleToggleAll}
              >
                <div className={cn("flex items-center justify-center")}>
                  {allFilteredSelected ? (
                    <SquareCheck
                      className="text-muted-foreground"
                      size={22}
                      strokeWidth={1.1}
                    />
                  ) : someFilteredSelected ? (
                    <SquareMinus
                      className="text-muted-foreground"
                      size={22}
                      strokeWidth={1.1}
                    />
                  ) : (
                    <Square
                      className="text-muted-foreground"
                      size={22}
                      strokeWidth={1.1}
                    />
                  )}
                </div>
                <span className="font-medium">(Select All)</span>
              </div>
            )}
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {allItems.map((option) => {
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => onSelect(option.value)}
                      value={option.value}
                    >
                      <div
                        className={cn("mr-2 flex items-center justify-center")}
                      >
                        {option.isSelected ? (
                          <SquareCheck
                            className={cn("text-muted-foreground")}
                            size={22}
                            strokeWidth={1.1}
                          />
                        ) : (
                          <Square
                            className={cn("text-muted-foreground")}
                            size={22}
                            strokeWidth={1.1}
                          />
                        )}
                      </div>
                      <span className="">
                        <span> {option.value} </span>
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
