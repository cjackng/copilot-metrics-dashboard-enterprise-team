"use client";
import { Card, CardContent } from "@/components/ui/card";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useDashboard } from "../dashboard-state";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { RequestsPerChatModeData, getRequestsPerChatMode } from "./common";
import { ChartHeader } from "./chart-header";

export const RequestsPerChatMode = () => {
  const { displayData } = useDashboard();
  const data = getRequestsPerChatMode(displayData);

  return (
    <Card className="col-span-4">
      <ChartHeader
        title="Requests per chat mode"
        description="User-initiated chat requests across all modes."
      />
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDataOverflow
              label={{ value: "Requests", angle: -90, position: "insideLeft", offset: 5 }}
            />
            <XAxis
              dataKey={chartConfig.timeFrameDisplay.key}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip cursor={true} content={<ChartTooltipContent />} />
            <Area
              dataKey={chartConfig.ask.key}
              type="linear"
              fill="hsl(var(--chart-1))"
              stroke="hsl(var(--chart-1))"
              fillOpacity={0.2}
              stackId="chat-modes"
            />
            <Area
              dataKey={chartConfig.inline.key}
              type="linear"
              fill="hsl(var(--chart-2))"
              stroke="hsl(var(--chart-2))"
              fillOpacity={0.2}
              stackId="chat-modes"
            />
            <Area
              dataKey={chartConfig.edit.key}
              type="linear"
              fill="hsl(var(--chart-3))"
              stroke="hsl(var(--chart-3))"
              fillOpacity={0.2}
              stackId="chat-modes"
            />
            <Area
              dataKey={chartConfig.agent.key}
              type="linear"
              fill="hsl(var(--chart-4))"
              stroke="hsl(var(--chart-4))"
              fillOpacity={0.2}
              stackId="chat-modes"
            />
            <Area
              dataKey={chartConfig.custom.key}
              type="linear"
              fill="hsl(var(--chart-5))"
              stroke="hsl(var(--chart-5))"
              fillOpacity={0.2}
              stackId="chat-modes"
            />
            <Area
              dataKey={chartConfig.plan.key}
              type="linear"
              fill="hsl(var(--chart-6))"
              stroke="hsl(var(--chart-6))"
              fillOpacity={0.2}
              stackId="chat-modes"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

const chartConfig: Record<DataKey, { label: string; key: DataKey; color?: string }> = {
  ask: {
    label: "Ask",
    key: "ask",
  },
  inline: {
    label: "Inline",
    key: "inline",
  },
  edit: {
    label: "Edit",
    key: "edit",
  },
  agent: {
    label: "Agent",
    key: "agent",
  },
  custom: {
    label: "Custom",
    key: "custom",
  },
  plan: {
    label: "Plan",
    key: "plan",
  },
  timeFrameDisplay: {
    label: "Time frame display",
    key: "timeFrameDisplay",
  },
};

type DataKey = keyof RequestsPerChatModeData;
