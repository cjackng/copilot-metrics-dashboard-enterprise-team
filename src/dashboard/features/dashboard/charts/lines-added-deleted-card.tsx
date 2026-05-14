"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "../dashboard-state";
import { ChartHeader } from "@/features/common/chart-header";
import { computeTotalLinesAdded, computeTotalLinesDeleted, formatCompact } from "./common";

export const LinesAddedDeletedCard = () => {
  const { displayData, isLoading } = useDashboard();
  const totalAdded = computeTotalLinesAdded(displayData);
  const totalDeleted = computeTotalLinesDeleted(displayData);

  return (
    <Card className="flex flex-col min-h-[140px]">
      <ChartHeader
        title="Lines added / deleted"
        description="LOC added and deleted by Copilot"
        tip="Total lines of code added and deleted by Copilot across all users and features in the selected period."
      />
      <CardContent className="flex flex-row gap-6 flex-1 items-center py-0 pb-4">
        <div className="flex flex-col flex-1">
          <span className="text-[1.9rem] tracking-tighter leading-none">
            {isLoading ? "..." : formatCompact(totalAdded)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">Lines added</span>
        </div>
        <div className="w-px self-stretch bg-border" />
        <div className="flex flex-col flex-1">
          <span className="text-[1.9rem] tracking-tighter leading-none">
            {isLoading ? "..." : formatCompact(totalDeleted)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">Lines deleted</span>
        </div>
      </CardContent>
    </Card>
  );
};
