"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChartHeader } from "@/features/common/chart-header";
import { MuiDataGridTable, customContainsOperator } from "@/components/ui/mui-data-grid-table";
import { UserUsageData } from "@/features/common/models";
import { useDashboard } from "../premium-requests-state";
import { format } from "date-fns";
import { GridColDef, getGridSingleSelectOperators, getGridNumericOperators } from "@mui/x-data-grid";
import { useMemo } from "react";

export const PremiumRequestsTable = () => {
  const { filteredUserUsageData: userUsageData, startDate, endDate } = useDashboard();

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

  const columns = useMemo((): GridColDef<UserUsageData>[] => [
    { field: "userDisplayName", headerName: "Username", flex: 1, minWidth: 140 },
    { field: "user", headerName: "User ID", flex: 1, minWidth: 140 },
    {
      field: "totalRequestQuantity",
      headerName: "Total Requests",
      type: "number",
      flex: 1,
      minWidth: 130,
      filterOperators: [
        customContainsOperator,
        ...getGridNumericOperators(),
      ],
      valueFormatter: (value: number | null) =>
        value != null ? Math.round(value).toLocaleString() : "",
    },
    {
      field: "totalRequestQuota",
      headerName: "Request Quota",
      type: "number",
      flex: 1,
      minWidth: 130,
      filterOperators: [
        customContainsOperator,
        ...getGridNumericOperators(),
      ],
      valueFormatter: (value: number | null | undefined) =>
        value === null || value === undefined ? "N/A" : Math.round(value).toLocaleString(),
    },
    {
      field: "team",
      headerName: "Team",
      flex: 1,
      minWidth: 150,
      type: 'singleSelect',
      valueOptions: availableTeams,
      filterOperators: [
        customContainsOperator,
        ...getGridSingleSelectOperators(),
      ],
      valueGetter: (value: string[] | string | null) =>
        Array.isArray(value) ? value.join(", ") : (value ?? ""),
    },
  ], [availableTeams]);

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
      <Card>
        <ChartHeader
          title="Premium Request Usage"
          description={`Premium request usage by user from ${format(new Date(startDate), "dd MMM yyyy")} to ${format(new Date(endDate), "dd MMM yyyy")}`}
        />
        <CardContent>
          <MuiDataGridTable<UserUsageData>
            columns={columns}
            rows={userUsageData}
            getRowId={(row) => row.user}
            height={345}
            enableSearch
            enableColumnFilter
            enableColumnToggle
            enableExport
          />
        </CardContent>
      </Card>
    </div>
  );
};
