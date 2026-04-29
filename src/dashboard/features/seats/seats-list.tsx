"use client";
import { useDashboard } from "./seats-state";
import { ChartHeader } from "@/features/common/chart-header";
import { Card, CardContent } from "@/components/ui/card";
import { stringIsNullOrEmpty } from "@/utils/helpers";
import { AgGridTable } from "@/components/ui/ag-grid-table";
import { AgGridMultiSelectFilter } from "@/components/ui/ag-grid-multi-select-filter";
import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { format } from "date-fns";
import { useMemo } from "react";

interface SeatData {
    username: string;
    userid: string;
    organization: string | null;
    team: string | null;
    createdAt: string;
    updatedAt: string;
    lastActivityAt: string;
    lastActivityEditor: string;
    planType: string;
    pendingCancellationDate: string;
}

function formatEditorName(editor: string): string {
    if (stringIsNullOrEmpty(editor)) {
        return editor;
    }
    const editorInfo = editor.split('/');
    return `${editorInfo[0]} (${editorInfo[1]})`;
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

const toISODate = (date: Date | string | null | undefined): string => {
    if (!date) return "-";
    try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? "-" : d.toISOString().slice(0, 10);
    } catch {
        return "-";
    }
};

export const SeatsList = () => {
    const { seatsData, loginToDisplayNameMap } = useDashboard();
    const hasOrganization = seatsData?.seats.some((seat) => seat.organization);
    const hasTeam = seatsData?.seats.some((seat) => seat.assigning_team);

    const columnDefs = useMemo<ColDef<SeatData>[]>(() => [
        { field: "username", headerName: "Username", filter: "agTextColumnFilter" },
        { field: "userid", headerName: "User ID", filter: "agTextColumnFilter" },
        ...(hasOrganization ? [{
            field: "organization" as keyof SeatData,
            headerName: "Organization",
            filter: AgGridMultiSelectFilter,
        }] : []),
        ...(hasTeam ? [{
            field: "team" as keyof SeatData,
            headerName: "Team",
            filter: AgGridMultiSelectFilter,
        }] : []),
        { field: "createdAt", headerName: "Create Date", filter: "agDateColumnFilter", valueFormatter: formatDateValue },
        { field: "updatedAt", headerName: "Update Date", filter: "agDateColumnFilter", valueFormatter: formatDateValue, hide: true },
        { field: "lastActivityAt", headerName: "Last Activity Date", filter: "agDateColumnFilter", valueFormatter: formatDateValue },
        { field: "lastActivityEditor", headerName: "Last Activity Editor", filter: "agTextColumnFilter" },
        { field: "planType", headerName: "Plan", filter: AgGridMultiSelectFilter, hide: true },
        { field: "pendingCancellationDate", headerName: "Pending Cancellation", filter: "agDateColumnFilter", valueFormatter: formatDateValue, hide: true },
    ], [hasOrganization, hasTeam]);

    const rowData = useMemo(() =>
        (seatsData?.seats ?? []).map((seat) => ({
            username: loginToDisplayNameMap[seat.assignee.login] || "-",
            userid: seat.assignee.login,
            organization: seat.organization?.login ?? null,
            team: seat.assigning_team?.name ?? null,
            createdAt: toISODate(seat.created_at),
            updatedAt: toISODate(seat.updated_at),
            lastActivityAt: seat.last_activity_at ? toISODate(seat.last_activity_at) : "-",
            lastActivityEditor: formatEditorName(seat.last_activity_editor),
            planType: seat.plan_type,
            pendingCancellationDate: seat.pending_cancellation_date ? toISODate(seat.pending_cancellation_date) : "-",
        })),
        [seatsData, loginToDisplayNameMap]
    );

    return (
        <Card className="col-span-4">
            <ChartHeader
                title="Assigned Seats"
                description=""
            />
            <CardContent>
                <AgGridTable<SeatData>
                    columnDefs={columnDefs}
                    rowData={rowData}
                    enableExport
                    enableSearch
                    enableColumnToggle
                    searchPlaceholder="Filter seats..."
                />
            </CardContent>
        </Card>
    );
};
