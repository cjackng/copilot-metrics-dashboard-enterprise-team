"use client";
import { useSeats } from "./seats-state";
import { ChartHeader } from "@/features/common/chart-header";
import { Card, CardContent } from "@/components/ui/card";
import { stringIsNullOrEmpty } from "@/utils/helpers";
import { MuiDataGridTable, customContainsOperator } from "@/components/ui/mui-data-grid-table";
import { GridColDef, GridColumnVisibilityModel, getGridSingleSelectOperators, getGridDateOperators } from "@mui/x-data-grid";
import { format } from "date-fns";
import { useMemo } from "react";
import { SeatSnapshotRow } from "@/services/copilot-seat-service";

function formatEditorName(editor: string | null): string {
  if (!editor || stringIsNullOrEmpty(editor)) return "-";
  const parts = editor.split("/");
  return parts.length >= 2 ? `${parts[0]} (${parts[1]})` : editor;
}

export const SeatsList = () => {
  const { filteredSeats, seats } = useSeats();

  // Array.from avoids the Valtio proxy invariant violation that occurs when
  // calling index-based array methods (e.g. .some()) directly on a snapshot.
  const seatsArray = Array.from(seats);
  const hasOrganization = seatsArray.some((s) => s.organization);
  const hasTeam = seatsArray.some((s) => s.team);

  const availableOrgs = useMemo(() => {
    const set = new Set<string>();
    for (const s of filteredSeats) {
      if (s.organization && s.organization !== "null" && s.organization !== "undefined")
        set.add(s.organization);
    }
    return Array.from(set).sort();
  }, [filteredSeats]);

  const availableTeams = useMemo(() => {
    const set = new Set<string>();
    for (const s of filteredSeats) {
      if (s.team && s.team !== "null" && s.team !== "undefined") set.add(s.team);
    }
    return Array.from(set).sort();
  }, [filteredSeats]);

  const availablePlans = useMemo(() => {
    const set = new Set<string>();
    for (const s of seats) {
      if (s.plan_type) set.add(s.plan_type);
    }
    return Array.from(set).sort();
  }, [seats]);

  const columns = useMemo<GridColDef<SeatSnapshotRow>[]>(() => [
    {
      field: "display_username",
      headerName: "Username",
      flex: 1,
      minWidth: 140,
      valueFormatter: (v: string | null) => v ?? "-",
    },
    {
      field: "username",
      headerName: "User ID",
      flex: 1,
      minWidth: 140,
    },
    ...(hasOrganization ? [{
      field: "organization" as keyof SeatSnapshotRow,
      headerName: "Organization",
      flex: 1,
      minWidth: 140,
      type: "singleSelect" as const,
      filterOperators: [
        customContainsOperator,
        ...getGridSingleSelectOperators(),
      ],
      valueOptions: availableOrgs,
    }] : []),
    ...(hasTeam ? [{
      field: "team" as keyof SeatSnapshotRow,
      headerName: "Team",
      flex: 1,
      minWidth: 130,
      type: "singleSelect" as const,
      filterOperators: [
        customContainsOperator,
        ...getGridSingleSelectOperators(),
      ],
      valueOptions: availableTeams,
    }] : []),
    {
      field: "created_at",
      headerName: "Create Date",
      flex: 1,
      minWidth: 130,
      type: "date",
      filterOperators: [
        customContainsOperator,
        ...getGridDateOperators(),
      ],
      valueGetter: (v: string | null) => (v ? new Date(v) : null),
      valueFormatter: (v: Date | null) => (v ? format(v, "dd MMM yyyy") : "-"),
    },
    {
      field: "updated_at",
      headerName: "Update Date",
      flex: 1,
      minWidth: 130,
      type: "date",
      filterOperators: [
        customContainsOperator,
        ...getGridDateOperators(),
      ],
      valueGetter: (v: string | null) => (v ? new Date(v) : null),
      valueFormatter: (v: Date | null) => (v ? format(v, "dd MMM yyyy") : "-"),
    },
    {
      field: "last_activity_at",
      headerName: "Last Activity Date",
      flex: 1,
      minWidth: 150,
      type: "date",
      filterOperators: [
        customContainsOperator,
        // customContainsOperator,
        ...getGridDateOperators(),
      ],
      valueGetter: (v: string | null) => (v ? new Date(v) : null),
      valueFormatter: (v: Date | null) => (v ? format(v, "dd MMM yyyy") : "-"),
    },
    {
      field: "last_activity_editor",
      headerName: "Last Activity Editor",
      flex: 1,
      minWidth: 180,
      valueFormatter: (v: string | null) => formatEditorName(v),
    },
    {
      field: "plan_type",
      headerName: "Plan",
      flex: 1,
      minWidth: 110,
      type: "singleSelect",
      filterOperators: [
        customContainsOperator,
        ...getGridSingleSelectOperators(),
      ],
      valueOptions: availablePlans,
    },
    {
      field: "pending_cancellation_date",
      headerName: "Pending Cancellation",
      flex: 1,
      minWidth: 180,
      type: "date",
      filterOperators: [
        customContainsOperator,
        ...getGridDateOperators(),
      ],
      valueGetter: (v: string | null) => (v ? new Date(v) : null),
      valueFormatter: (v: Date | null) => (v ? format(v, "dd MMM yyyy") : "-"),
    },
  ], [hasOrganization, hasTeam, availableOrgs, availableTeams, availablePlans]);

  const initialColumnVisibility = useMemo<GridColumnVisibilityModel>(() => ({
    updated_at: false,
    plan_type: false,
    pending_cancellation_date: false,
  }), []);

  return (
    <Card className="col-span-4">
      <ChartHeader title="Assigned Seats" description="" />
      <CardContent>
        <MuiDataGridTable<SeatSnapshotRow>
          columns={columns}
          rows={filteredSeats as SeatSnapshotRow[]}
          getRowId={(row) => row.username}
          height={350}
          enableSearch
          enableColumnFilter
          enableColumnToggle
          enableExport
          initialColumnVisibility={initialColumnVisibility}
        />
      </CardContent>
    </Card>
  );
};
