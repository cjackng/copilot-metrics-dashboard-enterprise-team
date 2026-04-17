"use client";
import { Card, CardContent } from "@/components/ui/card";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useDashboard } from "../dashboard-state";
import { ChartHeader } from "./chart-header";
import {
  codeCompletionSuggestionAcceptanceData,
  codeCompletionSuggestionsAndAcceptances,
} from "./common";

export const CodeCompletions = () => {
  const { displayData } = useDashboard();
  const data = codeCompletionSuggestionsAndAcceptances(displayData);
  return (
    <Card className="col-span-4">
      <ChartHeader
        title="Code completions"
        description="Inline code suggestions shown and accepted."
      />
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-80">
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDataOverflow
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
              dataKey={chartConfig.suggestedCompletions.key}
              type="linear"
              fill="hsl(var(--chart-2))"
              stroke="hsl(var(--chart-2))"
            />
            <Area
              dataKey={chartConfig.acceptedCompletions.key}
              type="linear"
              fill="hsl(var(--chart-1))"
              stroke="hsl(var(--chart-1))"
              fillOpacity={0.6}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

const chartConfig: Record<
  DataKey,
  {
    label: string;
    key: DataKey;
  }
> = {
  ["acceptedCompletions"]: {
    label: "Accepted completions",
    key: "acceptedCompletions",
  },
  ["suggestedCompletions"]: {
    label: "Suggested completions",
    key: "suggestedCompletions",
  },
  ["timeFrameDisplay"]: {
    label: "Time frame display",
    key: "timeFrameDisplay",
  },
};

type DataKey = keyof codeCompletionSuggestionAcceptanceData;
