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
import { ChartHeader } from "./chart-header";
import { AgentCodeChangesByFeatureData, getAgentInitiatedCodeChanges } from "./common";

export const AgentInitiatedCodeChanges = () => {
  const { displayData } = useDashboard();
  const data = getAgentInitiatedCodeChanges(displayData);

  return (
    <Card>
      <ChartHeader
        title="Agent-initiated code changes"
        description="Compares the total lines of code automatically added to and deleted from the codebase by agents on behalf of users, combining edit, agent, and custom modes"
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
              dataKey={chartConfig.feature.key}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
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
  feature: { label: "Feature", key: "feature" },
  added: { label: "Added", key: "added" },
  deleted: { label: "Deleted", key: "deleted" },
};

type DataKey = keyof AgentCodeChangesByFeatureData;
