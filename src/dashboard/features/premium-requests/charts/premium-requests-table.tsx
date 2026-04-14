"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChartHeader } from "@/features/dashboard/charts/chart-header";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { UserUsageData } from "@/features/common/models";
import { Column, Row } from "@tanstack/react-table";
import { useDashboard } from "../premium-requests-state";

const teamFilterFn: FilterFn<UserUsageData> = (row, columnId, filterValues: string[]) => {
  if (!filterValues || filterValues.length === 0) return true;
  const teams = row.getValue(columnId) as string[];
  return filterValues.some(team => teams.includes(team));
};

const formatPremiumRequestTitle = (latestUpdateTime: string) => {
  const date = new Date(latestUpdateTime);

  // Safety check
  if (isNaN(date.getTime())) {
    throw new Error('Invalid latestUpdateTime string provided');
  }

  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Hong_Kong'
  });

  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Hong_Kong'
  });

  const formattedTime = `${datePart} ${timePart} HKT`;

  return `Premium Request Usage (Latest Update at: ${formattedTime})`;
}

const userColumns: ColumnDef<UserUsageData>[] = [
  {
    accessorKey: "userDisplayName",
    id: "userDisplayName",
    meta: { name: "Username" },
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
    meta: { name: "User ID" },
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
    meta: { name: "Total Requests" },
    header: ({ column }: { column: Column<UserUsageData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Total Requests" />
    ),
    cell: ({ row }: { row: Row<UserUsageData> }) => {
      return <div className="ml-2">{row.original.totalRequestQuantity.toFixed(0)}</div>;
    },
  },
  {
    accessorKey: "totalRequestQuota",
    id: "totalRequestQuota",
    meta: { name: "Request Quota" },
    header: ({ column }: { column: Column<UserUsageData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Request Quota" />
    ),
    cell: ({ row }: { row: Row<UserUsageData> }) => {
      return <div className="ml-2">{row.original.totalRequestQuota.toFixed(0)}</div>;
    },
  },
  {
    accessorKey: "team",
    id: "team",
    meta: { name: "Team" },
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
        title={`Premium Request Usage (Latest Update at: ${latestUpdateTime.toLocaleString()})`}
        description={`Premium request usage by user from ${startDate} to ${endDate}`}
      />
      <CardContent>
        <DataTable 
          columns={userColumns} 
          data={userUsageData}
          enableExport
          filters={[{ column: "team", label: "Team" }]}
          summaryField="totalRequestQuantity"
        />
      </CardContent>
    </Card>
  );
};