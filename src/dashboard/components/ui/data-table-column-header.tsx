import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ColumnFilterType, DataTableColumnFilter } from "./data-table-column-filter";

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>;
    title: string;
}

export function DataTableColumnHeader<TData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {
    const filterType = (column.columnDef.meta as { filterType?: ColumnFilterType })?.filterType;
    const canSort = column.getCanSort();

    if (!canSort && !filterType) {
        return <div className={cn(className)}>{title}</div>;
    }

    return (
        <div className={cn("flex items-center", className)}>
            {canSort ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-1 h-8 data-[state=open]:bg-accent gap-2">
                            <span>{title}</span>
                            {column.getIsSorted() === "desc" ? <ArrowDown className="h-4 w-4" /> : column.getIsSorted() === "asc" ? <ArrowUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem
                            onClick={() => column.toggleSorting(false)}
                            className="gap-2">
                            <ArrowUp className="h-3.5 w-3.5 text-muted-foreground/70" />
                            Asc
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => column.toggleSorting(true)}
                            className="gap-2">
                            <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/70" />
                            Desc
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => column.toggleVisibility(false)}
                            className="gap-2">
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
                            Hide
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <span className="-ml-1 px-2 text-sm">{title}</span>
            )}
            {filterType && (
                <DataTableColumnFilter column={column} filterType={filterType} />
            )}
        </div>
    );
}
