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

import {
  CodeCompletionAcceptanceRateData,
  computeCodeCompletionAcceptanceRate,
} from "./common";
import { ChartHeader } from "./chart-header";

export const CodeCompletionsAcceptanceRate = () => {
  const { displayData } = useDashboard();
  const data = computeCodeCompletionAcceptanceRate(displayData);

  return (
    <Card>
      <ChartHeader
        title="Code completions acceptance rate"
        description="Percentage of shown inline completions that were either fully or partially accepted."
      />
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <YAxis
              dataKey={chartConfig.acceptanceRate.key}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
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
              dataKey={chartConfig.acceptanceRate.key}
              type="linear"
              fill="hsl(var(--chart-2))"
              stroke="hsl(var(--chart-2))"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

const chartConfig: Record<DataKey, { label: string; key: DataKey }> = {
  acceptanceRate: {
    label: "Acceptance Rate (%)",
    key: "acceptanceRate",
  },
  timeFrameDisplay: {
    label: "Time frame display",
    key: "timeFrameDisplay",
  },
};

type DataKey = keyof CodeCompletionAcceptanceRateData;
