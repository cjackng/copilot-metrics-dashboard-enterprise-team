"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AllCommunityModule,
  type ColDef,
  type Column,
  type GridApi,
  type GridReadyEvent,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import { agGridShadcnTheme } from "./ag-grid-theme";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { Download, Search, Columns3, RotateCcw } from "lucide-react";
import { Input } from "./input";

interface ColumnVisibility {
  colId: string;
  headerName: string;
  visible: boolean;
}

interface AgGridTableProps<TData> {
  columnDefs: ColDef<TData>[];
  rowData: TData[];
  /** Height of the grid container. Default: "500px" */
  height?: string;
  /** Enable CSV export button */
  enableExport?: boolean;
  /** Enable quick-filter search bar */
  enableSearch?: boolean;
  /** Enable columns visibility toggle */
  enableColumnToggle?: boolean;
  /** Placeholder for search bar */
  searchPlaceholder?: string;
  /** Content rendered in a status bar at the bottom of the grid */
  statusBarContent?: React.ReactNode;
  /** Default column definition overrides */
  defaultColDef?: ColDef<TData>;
  /** Callback when grid is ready */
  onGridReady?: (api: GridApi<TData>) => void;
  /** Callback when filters change */
  onFilterChanged?: () => void;
  /** Auto-size columns to fit */
  autoSizeColumns?: boolean;
}

const modules = [AllCommunityModule];

export function AgGridTable<TData>({
  columnDefs,
  rowData,
  height = "400px",
  enableExport = false,
  enableSearch = false,
  enableColumnToggle = false,
  searchPlaceholder = "Search...",
  statusBarContent,
  defaultColDef: defaultColDefOverride,
  onGridReady,
  onFilterChanged,
  autoSizeColumns = true,
}: AgGridTableProps<TData>) {
  const gridRef = useRef<AgGridReact<TData>>(null);
  const [searchText, setSearchText] = useState("");
  const [gridApi, setGridApi] = useState<GridApi<TData> | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility[]>([]);

  const defaultColDef = useMemo<ColDef<TData>>(
    () => ({
      sortable: true,
      resizable: false,
      filter: true,
      floatingFilter: false,
      filterParams: {
        buttons: ["reset"],
      },
      menuTabs: ["filterMenuTab", "generalMenuTab", "columnsMenuTab"],
      ...defaultColDefOverride,
    }),
    [defaultColDefOverride]
  );

  const refreshColumnVisibility = useCallback((api: GridApi<TData>) => {
    const allCols = api.getColumns?.() ?? [];
    setColumnVisibility(
      allCols.map((col: Column) => ({
        colId: col.getColId(),
        headerName:
          col.getColDef().headerName || col.getColId(),
        visible: col.isVisible(),
      }))
    );
  }, []);

  const handleGridReady = useCallback(
    (event: GridReadyEvent<TData>) => {
      setGridApi(event.api);
      if (autoSizeColumns) {
        event.api.sizeColumnsToFit();
      }
      refreshColumnVisibility(event.api);
      onGridReady?.(event.api);
    },
    [onGridReady, autoSizeColumns, refreshColumnVisibility]
  );

  // Keep column visibility state in sync when columnDefs change
  useEffect(() => {
    if (gridApi) {
      refreshColumnVisibility(gridApi);
    }
  }, [gridApi, columnDefs, refreshColumnVisibility]);

  const handleToggleColumn = useCallback(
    (colId: string, visible: boolean) => {
      if (!gridApi) return;
      gridApi.setColumnsVisible([colId], visible);
      if (autoSizeColumns) {
        gridApi.sizeColumnsToFit();
      }
      refreshColumnVisibility(gridApi);
    },
    [gridApi, autoSizeColumns, refreshColumnVisibility]
  );

  // Track whether grid state has been modified from defaults
  const [isDirty, setIsDirty] = useState(false);

  const checkDirty = useCallback(
    (api: GridApi<TData>) => {
      // Check search text
      if (searchText) {
        setIsDirty(true);
        return;
      }
      // Check filters
      const filterModel = api.getFilterModel();
      if (filterModel && Object.keys(filterModel).length > 0) {
        setIsDirty(true);
        return;
      }
      // Check column state (sort, order, visibility differ from defaults)
      const colState = api.getColumnState();
      const hasSort = colState?.some((c) => c.sort != null);
      const hasReorder = colState?.some(
        (c, i) => {
          const def = columnDefs[i];
          if (!def) return true;
          const defField = (def as ColDef<TData>).field as string | undefined;
          return defField != null && c.colId !== defField;
        }
      );
      const hasVisibilityChange = colState?.some((c) => {
        const def = columnDefs.find(
          (d) => (d as ColDef<TData>).field === c.colId
        );
        if (!def) return false;
        const defaultHide = (def as ColDef<TData>).hide ?? false;
        return c.hide !== defaultHide;
      });
      setIsDirty(!!(hasSort || hasReorder || hasVisibilityChange));
    },
    [searchText, columnDefs]
  );

  // Re-check dirty state when search text changes
  useEffect(() => {
    if (gridApi) checkDirty(gridApi);
  }, [gridApi, searchText, checkDirty]);

  const handleReset = useCallback(() => {
    if (!gridApi) return;
    gridApi.setFilterModel(null);
    setSearchText("");
    gridApi.setGridOption("quickFilterText", "");
    gridApi.resetColumnState();
    if (autoSizeColumns) {
      gridApi.sizeColumnsToFit();
    }
    refreshColumnVisibility(gridApi);
    setIsDirty(false);
  }, [gridApi, autoSizeColumns, refreshColumnVisibility]);

  const handleExport = useCallback(() => {
    gridApi?.exportDataAsCsv({
      fileName: "export.csv",
      processCellCallback: (params) => {
        const value = params.value;
        if (Array.isArray(value)) return value.join(", ");
        if (value === null || value === undefined) return "";
        return String(value);
      },
    });
  }, [gridApi]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setSearchText(text);
      gridApi?.setGridOption("quickFilterText", text);
    },
    [gridApi]
  );

  const showToolbar = enableSearch || enableExport || enableColumnToggle;

  return (
    <AgGridProvider modules={modules}>
      <div className="space-y-3">
        {/* Toolbar */}
        {showToolbar && (
          <div className="flex items-center justify-between gap-2">
            {enableSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchText}
                  onChange={handleSearchChange}
                  className="h-9 pl-8"
                />
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {isDirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 text-muted-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
              {enableColumnToggle && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <Columns3 className="h-4 w-4" />
                      Columns
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 p-0">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">Toggle columns</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                      {columnVisibility.map((col) => (
                        <label
                          key={col.colId}
                          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                        >
                          <Checkbox
                            checked={col.visible}
                            onCheckedChange={(checked) =>
                              handleToggleColumn(col.colId, !!checked)
                            }
                          />
                          <span className="truncate">{col.headerName}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {enableExport && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Grid + Status bar */}
        <div className="w-full rounded-md border overflow-hidden">
          <div style={{ height }}>
            <AgGridReact<TData>
              ref={gridRef}
              theme={agGridShadcnTheme}
              columnDefs={columnDefs}
              rowData={rowData}
              defaultColDef={defaultColDef}
              onGridReady={handleGridReady}
              onFilterChanged={() => {
                onFilterChanged?.();
                if (gridRef.current?.api) checkDirty(gridRef.current.api);
              }}
              animateRows={false}
              suppressCellFocus={true}
              enableCellTextSelection={true}
              popupParent={
                typeof document !== "undefined" ? document.body : undefined
              }
              onGridSizeChanged={(event) => {
                if (autoSizeColumns) {
                  event.api.sizeColumnsToFit();
                }
              }}
              onColumnVisible={(event) => {
                if (event.api) {
                  refreshColumnVisibility(event.api);
                  checkDirty(event.api);
                }
              }}
              onSortChanged={(event) => {
                if (event.api) checkDirty(event.api);
              }}
              onColumnMoved={(event) => {
                if (event.api) checkDirty(event.api);
              }}
            />
          </div>
          {statusBarContent && (
            <div className="flex items-center justify-end gap-6 border-t bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
              {statusBarContent}
            </div>
          )}
        </div>
      </div>
    </AgGridProvider>
  );
}
