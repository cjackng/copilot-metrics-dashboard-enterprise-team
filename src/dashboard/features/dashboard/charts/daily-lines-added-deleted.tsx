"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useDashboard } from "../dashboard-state";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartHeader } from "@/features/common/chart-header";
import { DailyLinesData, getDailyLinesAddedDeleted } from "./common";

export const DailyLinesAddedDeleted = () => {
  const { displayData } = useDashboard();
  const data = getDailyLinesAddedDeleted(displayData);

  return (
    <Card className="col-span-4">
      <ChartHeader
        title="Daily total of lines added and deleted"
        description="Total lines of code added to and deleted from the codebase across all modes"
      />
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-80">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDataOverflow
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              label={{ value: "Lines of code", angle: -90, position: "insideLeft", offset: 10 }}
            />
            <XAxis
              dataKey={chartConfig.timeFrameDisplay.key}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip cursor={true} content={<ChartTooltipContent />} />
            <Bar dataKey={chartConfig.added.key} fill="hsl(var(--chart-4))" radius={4} />
            <Bar dataKey={chartConfig.deleted.key} fill="hsl(var(--chart-5))" radius={4} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

const chartConfig: Record<DataKey, { label: string; key: DataKey }> = {
  added: { label: "Added", key: "added" },
  deleted: { label: "Deleted", key: "deleted" },
  timeFrameDisplay: { label: "Time frame display", key: "timeFrameDisplay" },
};

type DataKey = keyof DailyLinesData;
