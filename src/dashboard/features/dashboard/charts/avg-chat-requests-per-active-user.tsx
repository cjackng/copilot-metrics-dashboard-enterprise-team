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
  AvgChatRequestsPerActiveUserData,
  computeAvgChatRequestsPerActiveUser,
} from "./common";
import { ChartHeader } from "./chart-header";

export const AvgChatRequestsPerActiveUser = () => {
  const { displayData } = useDashboard();
  const data = computeAvgChatRequestsPerActiveUser(displayData);

  return (
    <Card className="col-span-4">
      <ChartHeader
        title="Average chat requests per active user"
        description="User-initiated requests across all chat modes, excluding code completions"
      />
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <YAxis
              dataKey={chartConfig.avgChatRequests.key}
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
              dataKey={chartConfig.avgChatRequests.key}
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
  avgChatRequests: {
    label: "Requests",
    key: "avgChatRequests",
  },
  timeFrameDisplay: {
    label: "Time frame display",
    key: "timeFrameDisplay",
  },
};

type DataKey = keyof AvgChatRequestsPerActiveUserData;
