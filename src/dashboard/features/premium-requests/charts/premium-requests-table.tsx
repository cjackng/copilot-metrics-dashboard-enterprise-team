"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChartHeader } from "@/features/dashboard/charts/chart-header";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { UserUsageData } from "@/features/common/models";
import { Column, Row } from "@tanstack/react-table";
import { useDashboard } from "../premium-requests-state";
import { format } from "date-fns";

const teamFilterFn: FilterFn<UserUsageData> = (row, columnId, filterValues: string[]) => {
  if (!filterValues || filterValues.length === 0) return true;
  const teams = row.getValue(columnId) as string[];
  return filterValues.some(team => teams.includes(team));
};

const formatPremiumRequestTitle = (latestUpdateTime: Date | null) => {
  if (!latestUpdateTime) {
    return "Premium Request Usage (Latest Update at: N/A)";
  }

  // Safety check
  if (isNaN(latestUpdateTime.getTime())) {
    throw new Error('Invalid latestUpdateTime string provided');
  }

  return `Premium Request Usage (Latest Update at: ${format(latestUpdateTime, "dd MMM yyyy HH:mm")})`;
}

const userColumns: ColumnDef<UserUsageData>[] = [
  {
    accessorKey: "userDisplayName",
    id: "userDisplayName",
    meta: { name: "Username", filterType: "text" as const },
    header: ({ column }: { column: Column<UserUsageData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
    cell: ({ row }: { row: Row<UserUsageData> }) => {
      return <div className="ml-2">{row.original.userDisplayName}</div>;
    },
  },
  {
    accessorKey: "user",
    id: "user",
    meta: { name: "User ID", filterType: "text" as const },
    header: ({ column }: { column: Column<UserUsageData, unknown> }) => (
      <DataTableColumnHeader column={column} title="User ID" />
    ),
    cell: ({ row }: { row: Row<UserUsageData> }) => {
      return <div className="ml-2">{row.original.user}</div>;
    },
  },
  {
    accessorKey: "totalRequestQuantity",
    id: "totalRequestQuantity",
    meta: { name: "Total Requests", filterType: "number" as const },
    header: ({ column }: { column: Column<UserUsageData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Total Requests" />
    ),
    cell: ({ row }: { row: Row<UserUsageData> }) => {
      return <div className="ml-2">{Math.round(row.original.totalRequestQuantity).toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "totalRequestQuota",
    id: "totalRequestQuota",
    meta: { name: "Request Quota", filterType: "number" as const },
    header: ({ column }: { column: Column<UserUsageData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Request Quota" />
    ),
    cell: ({ row }: { row: Row<UserUsageData> }) => {
      return (
        <div className="ml-2">
          {row.original.totalRequestQuota === null ? "N/A" : Math.round(row.original.totalRequestQuota).toLocaleString()}
        </div>
      )
    },
  },
  {
    accessorKey: "team",
    id: "team",
    meta: { name: "Team", filterType: "multiSelect" as const, isArrayColumn: true },
    header: ({ column }: { column: Column<UserUsageData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Team" />
    ),
    cell: ({ row }: { row: Row<UserUsageData> }) => {
      return <div className="ml-2">{row.original.team.join(", ")}</div>;
    },
    filterFn: teamFilterFn,
  }
].map((col) => ({
  accessorKey: col.accessorKey,
  id: col.id,
  meta: col.meta,
  header: col.header,
  cell: col.cell,
  filterFn: col.filterFn,
}));

export const PremiumRequestsTable = () => {
  const { userUsageData, startDate, endDate, latestUpdateTime } = useDashboard();

  if (userUsageData.length === 0) {
    return (
      <Card className="col-span-4">
        <ChartHeader
          title={formatPremiumRequestTitle(latestUpdateTime)}
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
    <Card className="col-span-4">
      <ChartHeader
        title={formatPremiumRequestTitle(latestUpdateTime)}
        description={`Premium request usage by user from ${format(new Date(startDate), "dd MMM yyyy")} to ${format(new Date(endDate), "dd MMM yyyy")}`}
      />
      <CardContent>
        <DataTable 
          columns={userColumns} 
          data={userUsageData}
          enableExport
          summaryField="totalRequestQuantity"
        />
      </CardContent>
    </Card>
  );
};