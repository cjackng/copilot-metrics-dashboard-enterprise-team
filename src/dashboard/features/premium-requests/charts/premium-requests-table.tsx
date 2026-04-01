"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartHeader } from "@/features/dashboard/charts/chart-header";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { PremiumRequestUsage } from "@/features/common/models";
import { Column, Row } from "@tanstack/react-table";

// To-Do: Refine the table component

// To-Do: consider adding more fields
interface UserUsageData {
  user: string;
  totalNetQuantity: number;
  totalNetAmount: number;
  models: string;
  products: string;
}

// To-Do: consider adding more fields
interface TeamUsageData {
  team: string;
  totalNetQuantity: number;
  totalNetAmount: number;
  users: UserUsageData[];
}

type TableData = TeamUsageData | UserUsageData;

const isTeamData = (data: TableData): data is TeamUsageData => {
  return 'users' in data && Array.isArray((data as TeamUsageData).users);
};

const teamColumns: ColumnDef<TableData>[] = [
  {
    accessorKey: "team",
    id: "team",
    meta: { name: "Team" },
    header: ({ column }: { column: Column<TableData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Team" />
    ),
    cell: ({ row }: { row: Row<TableData> }) => {
      const data = row.original;
      if (isTeamData(data)) {
        return <div className="ml-2 font-medium">{data.team}</div>;
      }
      return <div className="ml-2">{data.user}</div>;
    },
  },
  {
    accessorKey: "totalNetQuantity",
    id: "totalNetQuantity",
    meta: { name: "Total Requests" },
    header: ({ column }: { column: Column<TableData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Total Requests" />
    ),
    cell: ({ row }: { row: Row<TableData> }) => {
      const data = row.original;
      const quantity = isTeamData(data) ? data.totalNetQuantity : data.totalNetQuantity;
      return <div className="ml-2">{quantity}</div>;
    },
  },
  {
    accessorKey: "totalNetAmount",
    id: "totalNetAmount",
    meta: { name: "Total Cost ($)" },
    header: ({ column }: { column: Column<TableData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Total Cost ($)" />
    ),
    cell: ({ row }: { row: Row<TableData> }) => {
      const data = row.original;
      const amount = isTeamData(data) ? data.totalNetAmount : data.totalNetAmount;
      return <div className="ml-2">${amount.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "models",
    id: "models",
    meta: { name: "Models" },
    header: ({ column }: { column: Column<TableData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Models" />
    ),
    cell: ({ row }: { row: Row<TableData> }) => {
      const data = row.original;
      if (isTeamData(data)) {
        const allModels = new Set<string>();
        data.users.forEach(u => u.models.split(", ").forEach(m => m && allModels.add(m)));
        return <div className="ml-2">{Array.from(allModels).join(", ")}</div>;
      }
      return <div className="ml-2">{data.models}</div>;
    },
  },
  {
    accessorKey: "products",
    id: "products",
    meta: { name: "Products" },
    header: ({ column }: { column: Column<TableData, unknown> }) => (
      <DataTableColumnHeader column={column} title="Products" />
    ),
    cell: ({ row }: { row: Row<TableData> }) => {
      const data = row.original;
      if (isTeamData(data)) {
        const allProducts = new Set<string>();
        data.users.forEach(u => u.products.split(", ").forEach(p => p && allProducts.add(p)));
        return <div className="ml-2">{Array.from(allProducts).join(", ")}</div>;
      }
      return <div className="ml-2">{data.products}</div>;
    },
  },
].map((col) => ({
  accessorKey: col.accessorKey,
  id: col.id,
  meta: col.meta,
  header: col.header,
  cell: col.cell,
}));

const getTeamUsageData = (data: PremiumRequestUsage[]): TeamUsageData[] => {
  const teamMap = new Map<string, TeamUsageData>();

  // TO-DO: write join logic to combine team data and usage data

  return [];
};

export const PremiumRequestsTable = () => {
  const [data, setData] = useState<TeamUsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/premium-usage`, {
          cache: "no-store",
        });
        if (response.ok) {
          const result: PremiumRequestUsage[] = await response.json();
          const teamData = getTeamUsageData(result);
          setData(teamData);
        }
      } catch (e) {
        console.error("Failed to fetch premium usage:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSubRows = (row: TableData): UserUsageData[] | undefined => {
    if (isTeamData(row)) {
      return row.users;
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <Card className="col-span-4">
        <ChartHeader
          title="Premium Request Usage"
          description="Premium request usage by team with user breakdown"
        />
        <CardContent>
          <div className="flex items-center justify-center h-40">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="col-span-4">
        <ChartHeader
          title="Premium Request Usage"
          description="Premium request usage by team with user breakdown"
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
        title="Premium Request Usage"
        description="Click on a team to see individual user breakdown"
      />
      <CardContent>
        <DataTable 
          columns={teamColumns} 
          data={data} 
          enableExpand={true}
          getSubRows={getSubRows}
        />
      </CardContent>
    </Card>
  );
};