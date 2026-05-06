"use client";
import { useSeats, seatsStore } from "./seats-state";
import { ChartHeader } from "@/features/common/chart-header";
import { Card, CardContent } from "@/components/ui/card";
import { stringIsNullOrEmpty } from "@/utils/helpers";
import { AgGridTable } from "@/components/ui/ag-grid-table";
import { AgGridMultiSelectFilter } from "@/components/ui/ag-grid-multi-select-filter";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { format } from "date-fns";
import { useMemo } from "react";
import { SeatSnapshotRow } from "@/services/copilot-seat-service";

function formatEditorName(editor: string | null): string {
    if (!editor || stringIsNullOrEmpty(editor)) return "-";
    const editorInfo = editor.split('/');
    return editorInfo.length >= 2 ? `${editorInfo[0]} (${editorInfo[1]})` : editor;
}

const formatDateValue = (params: ValueFormatterParams): string => {
    const val = params.value;
    if (!val || val === "-") return "-";
    try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? val : format(d, "dd MMM yyyy");
    } catch {
        return val;
    }
};

export const SeatsList = () => {
    const { filteredSeats, seats } = useSeats();

    const hasOrganization = seats.some((s) => s.organization);
    const hasTeam = seats.some((s) => s.team);

    // Derive available teams from the page-filtered seats so the column filter options stay in sync
    const availableTeams = useMemo(() => {
        const set = new Set<string>();
        for (const seat of filteredSeats) {
            if (seat.team && seat.team !== "null" && seat.team !== "undefined") set.add(seat.team);
        }
        return Array.from(set).sort();
    }, [filteredSeats]);

    const columnDefs = useMemo<ColDef<SeatSnapshotRow>[]>(() => [
        {
            field: "display_username",
            headerName: "Username",
            filter: "agTextColumnFilter",
            valueFormatter: (p: ValueFormatterParams) => p.value ?? "-",
        },
        {
            field: "username",
            headerName: "User ID",
            filter: "agTextColumnFilter",
        },
        ...(hasOrganization ? [{
            field: "organization" as keyof SeatSnapshotRow,
            headerName: "Organization",
            filter: AgGridMultiSelectFilter,
        }] : []),
        ...(hasTeam ? [{
            field: "team" as keyof SeatSnapshotRow,
            headerName: "Team",
            filter: AgGridMultiSelectFilter,
            filterParams: { options: availableTeams },
        }] : []),
        { field: "created_at", headerName: "Create Date", filter: "agDateColumnFilter", valueFormatter: formatDateValue },
        { field: "updated_at", headerName: "Update Date", filter: "agDateColumnFilter", valueFormatter: formatDateValue, hide: true },
        { field: "last_activity_at", headerName: "Last Activity Date", filter: "agDateColumnFilter", valueFormatter: formatDateValue },
        {
            field: "last_activity_editor",
            headerName: "Last Activity Editor",
            filter: "agTextColumnFilter",
            valueFormatter: (p: ValueFormatterParams) => formatEditorName(p.value),
        },
        { field: "plan_type", headerName: "Plan", filter: AgGridMultiSelectFilter, hide: true },
        { field: "pending_cancellation_date", headerName: "Pending Cancellation", filter: "agDateColumnFilter", valueFormatter: formatDateValue, hide: true },
    ], [hasOrganization, hasTeam, availableTeams]);

    return (
        <Card className="col-span-4">
            <ChartHeader title="Assigned Seats" description="" />
            <CardContent>
                <AgGridTable<SeatSnapshotRow>
                    columnDefs={columnDefs}
                    rowData={filteredSeats as SeatSnapshotRow[]}
                    enableExport
                    enableSearch
                    enableColumnToggle
                    searchPlaceholder="Filter seats..."
                />
            </CardContent>
        </Card>
    );
};

