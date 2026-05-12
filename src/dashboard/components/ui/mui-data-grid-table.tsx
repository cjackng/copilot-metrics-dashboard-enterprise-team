"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridSortModel,
  GridColumnVisibilityModel,
  GridRowIdGetter,
  gridFilteredSortedRowEntriesSelector,
  useGridApiRef,
  Toolbar,
  QuickFilter,
  QuickFilterControl,
  QuickFilterClear,
  FilterPanelTrigger,
  ColumnsPanelTrigger,
  ExportCsv,
  GridFilterOperator,
  getGridStringOperators,
} from "@mui/x-data-grid";
import { Button } from "./button";
import { RotateCcw, X, Filter, Columns2, Download, Search } from "lucide-react";

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    isDirty?: boolean;
    onReset?: () => void;
    enableSearch?: boolean;
    enableColumnFilter?: boolean;
    enableColumnToggle?: boolean;
    enableExport?: boolean;
    csvFileName?: string;
  }
}

export const customContainsOperator: GridFilterOperator = {
  value: 'customContains',
  label: 'contains',
  InputComponent: getGridStringOperators().filter((op) => op.value === 'contains')[0].InputComponent,
  getApplyFilterFn: (filterItem) => {
    if (
      filterItem.value === undefined || filterItem.value === null || 
      filterItem.value === '' || (typeof filterItem.value === 'number' && Number.isNaN(filterItem.value))
    ) {
      return () => true;
    }
    const filterValue = String(filterItem.value).toLowerCase();
    return (value): boolean => {
      if (value === null || value === undefined) return false;
      if (value instanceof Date && !isNaN(value.getTime())) {
        const day = String(value.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[value.getMonth()];
        const year = String(value.getFullYear());
        const formattedDate = `${day} ${month} ${year}`;
        return formattedDate.toLowerCase().includes(filterValue);
      }
      return String(value).toLowerCase().includes(filterValue);
    };
  },
};

// Defined outside the parent component for a stable reference — avoids remount on every render
function DataGridToolbar({
  isDirty,
  onReset,
  enableSearch,
  enableColumnFilter,
  enableColumnToggle,
  enableExport,
  csvFileName,
}: {
  isDirty?: boolean;
  onReset?: () => void;
  enableSearch?: boolean;
  enableColumnFilter?: boolean;
  enableColumnToggle?: boolean;
  enableExport?: boolean;
  csvFileName?: string;
}) {
  return (
    <Toolbar
      style={{
        padding: "2px 8px",
        minHeight: "50px",
        maxHeight: "50px",
        borderBottom: "1px solid hsl(var(--border))",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {enableSearch && (
        <QuickFilter defaultExpanded style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <QuickFilterControl
            render={((props: any) => (
              <div className="relative flex items-center">
                <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
                <input
                  value={props.value ?? ""}
                  onChange={props.onChange}
                  onKeyDown={props.onKeyDown}
                  onBlur={props.onBlur}
                  placeholder="Search…"
                  className="h-9 w-44 pl-8 pr-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )) as any}
          />
          <QuickFilterClear
            render={((_props: any, state: any) =>
              state.value ? (
                <button
                  onClick={_props.onClick}
                  className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground rounded hover:bg-accent"
                >
                  <X size={12} />
                </button>
              ) : null
            ) as any}
          />
        </QuickFilter>
      )}
      <div style={{ flex: 1 }} />
      {isDirty && (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-9 gap-1 text-xs text-muted-foreground">
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      )}
      {enableColumnFilter && (
        <FilterPanelTrigger
          render={((props: any, state: any) => (
            <button
              {...props}
              title="Filters"
              className="relative h-9 w-9 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Filter size={14} />
              {state.filterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 text-[9px] bg-primary text-primary-foreground rounded-full flex items-center justify-center leading-none">
                  {state.filterCount}
                </span>
              )}
            </button>
          )) as any}
        />
      )}
      {enableColumnToggle && (
        <ColumnsPanelTrigger
          render={((props: any) => (
            <button
              {...props}
              title="Columns"
              className="h-9 w-9 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Columns2 size={14} />
            </button>
          )) as any}
        />
      )}
      {enableExport && (
        <ExportCsv
          render={((props: any) => (
            <button
              {...props}
              title="Export CSV"
              className="h-9 w-9 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Download size={14} />
            </button>
          )) as any}
          options={{ fileName: csvFileName ?? "export" }}
        />
      )}
    </Toolbar>
  );
}

export interface MuiDataGridTableProps<TRow extends object> {
  columns: GridColDef[];
  rows: TRow[];
  getRowId?: GridRowIdGetter<TRow>;
  /** Height of the grid area (not including toolbar/status bar). Default: "400px" */
  height?: string | number;
  enableSearch?: boolean;
  enableColumnFilter?: boolean;
  enableExport?: boolean;
  enableColumnToggle?: boolean;
  searchPlaceholder?: string;
  /** Rendered below the grid (e.g. summary stats) */
  statusBarContent?: React.ReactNode;
  /** Default column visibility — set `false` to hide a column initially */
  initialColumnVisibility?: GridColumnVisibilityModel;
  /** Called when filtered/sorted rows change — receives the filtered row models */
  onFilteredRowsChange?: (rows: TRow[]) => void;
}

function isFilterModelEmpty(m: GridFilterModel): boolean {
  return (
    (!m.items || m.items.length === 0 || m.items.every((i) => i.value === undefined || i.value === "")) &&
    (!m.quickFilterValues || m.quickFilterValues.length === 0)
  );
}

function isSortModelEmpty(m: GridSortModel): boolean {
  return m.length === 0;
}

function isVisibilityDefault(m: GridColumnVisibilityModel, init: GridColumnVisibilityModel): boolean {
  return JSON.stringify(m) === JSON.stringify(init);
}

export function MuiDataGridTable<TRow extends object>({
  columns,
  rows,
  getRowId,
  height = 400,
  enableSearch = false,
  enableColumnFilter = false,
  enableExport = false,
  enableColumnToggle = false,
  statusBarContent,
  initialColumnVisibility = {},
  onFilteredRowsChange,
}: MuiDataGridTableProps<TRow>) {
  const apiRef = useGridApiRef();

  // Convert to plain array — Valtio snapshot arrays cause proxy invariant violations
  // when MUI DataGrid accesses elements by numeric index inside createRowsInternalCache.
  const plainRows = useMemo(() => Array.from(rows), [rows]);

  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>(initialColumnVisibility);

  const isDirty =
    !isFilterModelEmpty(filterModel) ||
    !isSortModelEmpty(sortModel) ||
    !isVisibilityDefault(columnVisibilityModel, initialColumnVisibility);

  const handleReset = useCallback(() => {
    setFilterModel({ items: [] });
    setSortModel([]);
    setColumnVisibilityModel(initialColumnVisibility);
  }, [initialColumnVisibility]);

  // Runs when filter model or rows change to notify parent of updated filtered rows.
  // Scoped deps prevent the infinite-loop that an empty deps array would cause.
  useEffect(() => {
    if (!onFilteredRowsChange || !apiRef.current?.state) return;
    try {
      const entries = gridFilteredSortedRowEntriesSelector(apiRef);
      onFilteredRowsChange(entries.map((e) => e.model as TRow));
    } catch {
      // ignore if api not ready
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterModel, plainRows]);

  return (
    <div className="space-y-0 rounded-md border overflow-hidden">
      <div style={{ height }}>
        <DataGrid
          apiRef={apiRef}
          rows={plainRows}
          columns={columns}
          getRowId={getRowId}
          showToolbar
          slots={{ toolbar: DataGridToolbar }}
          slotProps={{
            toolbar: {
              isDirty,
              onReset: handleReset,
              enableSearch,
              enableColumnFilter,
              enableColumnToggle,
              enableExport,
            },
          }}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={setColumnVisibilityModel}
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
          disableColumnMenu={false}
          disableColumnResize={true}
          density="standard"
        />
      </div>
      {statusBarContent && (
        <div className="flex items-center justify-end gap-6 border-t bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
          {statusBarContent}
        </div>
      )}
    </div>
  );
}
