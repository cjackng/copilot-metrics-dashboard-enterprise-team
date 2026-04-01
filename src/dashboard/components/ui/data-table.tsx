"use client";

import * as React from "react";
import { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, getSortedRowModel, useReactTable, Row, Table as ReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableToolbar } from "./data-table-toolbar";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    initialVisibleColumns?: VisibilityState;
    search?: { column: string; placeholder: string };
    filters?: { column: string; label: string }[];
    enableExport?: boolean;
    enableExpand?: boolean;
    getSubRows?: (row: TData) => TData[] | undefined;
    expandAll?: boolean;
}

export function DataTable<TData, TValue>({ columns, data, initialVisibleColumns, search, filters, enableExport, enableExpand, getSubRows, expandAll }: DataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialVisibleColumns ?? {});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        if (expandAll && getSubRows) {
            const newExpanded: Record<string, boolean> = {};
            data.forEach((row, index) => {
                const rowId = `row-${index}`;
                if (getSubRows(row)) {
                    newExpanded[rowId] = true;
                }
            });
            setExpanded(newExpanded);
        } else if (!expandAll) {
            setExpanded({});
        }
    }, [expandAll, data, getSubRows]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getSubRows: getSubRows,
    });

    const toggleRowExpanded = (rowId: string) => {
        setExpanded(prev => ({
            ...prev,
            [rowId]: !prev[rowId]
        }));
    };

    const renderRows = (rows: Row<TData>[], level: number = 0): React.ReactNode => {
        return rows.map((row, index) => {
            const rowId = row.id;
            const subRows = getSubRows?.(row.original);
            const isExpanded = expanded[rowId];
            const hasSubRows = subRows && subRows.length > 0;

            return (
                <React.Fragment key={rowId}>
                    <TableRow
                        data-state={row.getIsSelected() && "selected"}
                        className={level > 0 ? "bg-muted/30" : ""}
                    >
                        {enableExpand && hasSubRows && (
                            <TableCell className="w-10">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-0 h-8 w-8"
                                    onClick={() => toggleRowExpanded(rowId)}
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </Button>
                            </TableCell>
                        )}
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className={level > 0 ? "pl-8" : ""}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                    </TableRow>
                    {hasSubRows && isExpanded && (
                        renderRows(row.subRows as Row<TData>[], level + 1)
                    )}
                </React.Fragment>
            );
        });
    };

    return (
        <div className="space-y-4">
            <DataTableToolbar
                table={table}
                search={search}
                filters={filters}
                enableExport={enableExport}
            />
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {enableExpand && (
                                    <TableHead className="w-10" />
                                )}
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            renderRows(table.getRowModel().rows)
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (enableExpand ? 1 : 0)}
                                    className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}