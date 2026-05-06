"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChartHeader } from "@/features/dashboard/charts/chart-header";
import { AgGridTable } from "@/components/ui/ag-grid-table";
import { AgGridMultiSelectFilter } from "@/components/ui/ag-grid-multi-select-filter";
import { UserUsageData } from "@/features/common/models";
import { useDashboard } from "../premium-requests-state";
import { format, parseISO } from "date-fns";
import { ColDef, GridApi, ValueFormatterParams } from "ag-grid-community";
import { useMemo, useState } from "react";

export const PremiumRequestsTable = () => {
  const { filteredUserUsageData: userUsageData, startDate, endDate, latestUpdateTime } = useDashboard();
  const [gridApi, setGridApi] = useState<GridApi<UserUsageData> | null>(null);
  const [filterVersion, setFilterVersion] = useState(0);

  // Derive available teams from the already page-filtered data so the column
  // filter options shrink to match the page-level team selection.
  const availableTeams = useMemo(() => {
    const set = new Set<string>();
    for (const row of userUsageData) {
      const teams = Array.isArray(row.team) ? row.team : [row.team];
      for (const t of teams) {
        if (t && t !== "null" && t !== "undefined") set.add(t);
      }
    }
    return Array.from(set).sort();
  }, [userUsageData]);

  const columnDefs = useMemo((): ColDef<UserUsageData>[] => [
    {
      field: "userDisplayName",
      headerName: "Username",
      filter: "agTextColumnFilter",
    },
    {
      field: "user",
      headerName: "User ID",
      filter: "agTextColumnFilter",
    },
    {
      field: "totalRequestQuantity",
      headerName: "Total Requests",
      filter: "agNumberColumnFilter",
      valueFormatter: (params: ValueFormatterParams) =>
        params.value != null ? Math.round(params.value).toLocaleString() : "",
    },
    {
      field: "totalRequestQuota",
      headerName: "Request Quota",
      filter: "agNumberColumnFilter",
      valueFormatter: (params: ValueFormatterParams) =>
        params.value === null || params.value === undefined
          ? "N/A"
          : Math.round(params.value).toLocaleString(),
    },
    {
      field: "team",
      headerName: "Team",
      filter: AgGridMultiSelectFilter,
      filterParams: { isArrayColumn: true, options: availableTeams },
      valueFormatter: (params: ValueFormatterParams) =>
        Array.isArray(params.value) ? params.value.join(", ") : params.value ?? "",
      getQuickFilterText: (params) =>
        Array.isArray(params.value) ? params.value.join(" ") : params.value ?? "",
    },
  ], [availableTeams]);

  const formattedLastUpdated = latestUpdateTime
    ? format(
        latestUpdateTime instanceof Date ? latestUpdateTime : parseISO(String(latestUpdateTime)),
        "dd MMM yyyy HH:mm",
      )
    : null;

  const summaryContent = useMemo(() => {
    if (!gridApi || userUsageData.length === 0) return null;
    let totalUsers = 0;
    let totalRequests = 0;
    gridApi.forEachNodeAfterFilter((node) => {
      if (node.data) {
        totalUsers++;
        totalRequests += node.data.totalRequestQuantity ?? 0;
      }
    });
    return (
      <>
        <span>Total Users: {totalUsers.toLocaleString()}</span>
        <span>Total Requests: {Math.round(totalRequests).toLocaleString()}</span>
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridApi, userUsageData, filterVersion]);

  if (userUsageData.length === 0) {
    return (
      <Card className="col-span-4">
        <ChartHeader
          title="Premium Request Usage"
          description="Premium request usage by user"
        />
        <CardContent>
          <div className="flex items-center justify-center h-40">
            No premium request usage data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="col-span-4 flex flex-col gap-4">
      {formattedLastUpdated && (
        <p className="text-xs text-muted-foreground text-right">
          Data last updated: {formattedLastUpdated}
        </p>
      )}
      <Card>
        <ChartHeader
          title="Premium Request Usage"
          description={`Premium request usage by user from ${format(new Date(startDate), "dd MMM yyyy")} to ${format(new Date(endDate), "dd MMM yyyy")}`}
        />
        <CardContent>
          <AgGridTable<UserUsageData>
            columnDefs={columnDefs}
            rowData={userUsageData}
            enableSearch
            enableExport
            enableColumnToggle
            statusBarContent={summaryContent}
            onGridReady={(api) => setGridApi(api)}
            onFilterChanged={() => setFilterVersion((v) => v + 1)}
          />
        </CardContent>
      </Card>
    </div>
  );
};