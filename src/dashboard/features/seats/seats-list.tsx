"use client";
import { useDashboard } from "./seats-state";
import { ChartHeader } from "@/features/common/chart-header";
import { Card, CardContent } from "@/components/ui/card";
import { stringIsNullOrEmpty } from "@/utils/helpers";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

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
    const editorName = `${editorInfo[0]} (${editorInfo[1]})`;

    return editorName;
}

const formatDisplayDate = (isoStr: string): string => {
    if (!isoStr || isoStr === "-") return "-";
    try {
        return format(parseISO(isoStr), "dd MMM yyyy");
    } catch {
        return isoStr;
    }
};

const columns: ColumnDef<SeatData>[] = [
    { accessorKey: "username", title: "Username", meta: { name: "Username", filterType: "text" } },
    { accessorKey: "userid", title: "User ID", meta: { name: "User ID", filterType: "text" } },
    { accessorKey: "organization", title: "Organization", meta: { name: "Organization", filterType: "multiSelect" } },
    { accessorKey: "team", title: "Team", meta: { name: "Team", filterType: "multiSelect" } },
    { accessorKey: "createdAt", title: "Create Date", meta: { name: "Create Date", filterType: "date" }, cellFormat: formatDisplayDate },
    { accessorKey: "updatedAt", title: "Update Date", meta: { name: "Update Date", filterType: "date" }, cellFormat: formatDisplayDate },
    { accessorKey: "lastActivityAt", title: "Last Activity Date", meta: { name: "Last Activity Date", filterType: "date" }, cellFormat: formatDisplayDate },
    { accessorKey: "lastActivityEditor", title: "Last Activity Editor", meta: { name: "Last Activity Editor", filterType: "text" } },
    { accessorKey: "planType", title: "Plan", meta: { name: "Plan", filterType: "multiSelect" } },
    { accessorKey: "pendingCancellationDate", title: "Pending Cancellation", meta: { name: "Pending Cancellation", filterType: "date" }, cellFormat: formatDisplayDate }
].map((col) => ({
    accessorKey: col.accessorKey,
    id: col.accessorKey,
    meta: col.meta,
    header: ({ column }) => (
        <DataTableColumnHeader
            column={column}
            title={col.title}
        />
    ),
    cell: ({ row }) => {
        const value = row.getValue(col.accessorKey) as string;
        const display = col.cellFormat ? col.cellFormat(value) : value;
        return <div className="ml-2">{display}</div>;
    },
}));

export const SeatsList = () => {
    const { seatsData, loginToDisplayNameMap } = useDashboard();

    const toISODate = (date: Date | string | null | undefined): string => {
        if (!date) return "-";
        try {
            const d = new Date(date);
            return isNaN(d.getTime()) ? "-" : d.toISOString().slice(0, 10);
        } catch {
            return "-";
        }
    };

    return (
        <Card className="col-span-4">
            <ChartHeader
                title="Assigned Seats"
                description=""
            />
            <CardContent>
                <DataTable
                    columns={columns.filter((col) => col.id !== "organization")}
                    data={(seatsData?.seats ?? []).map((seat) => ({
                        username: loginToDisplayNameMap[seat.assignee.login] || "-",
                        userid: seat.assignee.login,
                        organization: seat.organization?.login,
                        team: seat.assigning_team?.name,
                        createdAt: toISODate(seat.created_at),
                        updatedAt: toISODate(seat.updated_at),
                        lastActivityAt: seat.last_activity_at ? toISODate(seat.last_activity_at) : "-",
                        lastActivityEditor: formatEditorName(seat.last_activity_editor),
                        planType: seat.plan_type,
                        pendingCancellationDate: seat.pending_cancellation_date ? toISODate(seat.pending_cancellation_date) : "-",
                    }))}
                    initialVisibleColumns={{
                        updatedAt: false,
                        planType: false,
                        pendingCancellationDate: false,
                    }}
                    enableExport
                />
            </CardContent>
        </Card>
    );
};
