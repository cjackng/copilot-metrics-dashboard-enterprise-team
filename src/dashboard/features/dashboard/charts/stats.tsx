"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "../dashboard-state";
import { ChartHeader } from "./chart-header";
import {
  computeActiveUserAverage,
  computeAdoptionRate,
  computeCumulativeAcceptanceAverage,
} from "./common";
import StatsCard from "./stats-card";

export const Stats = () => {
  const { filteredSeatsData, displayData, isLoading } = useDashboard();
  const acceptanceAverage = computeCumulativeAcceptanceAverage(displayData);
  const averageActiveUsers = computeActiveUserAverage(displayData);
  const adoptionRate = computeAdoptionRate(filteredSeatsData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 col-span-4">
      <StatsCard
        title="Acceptance average"
        tip="How often users accept Copilot's code suggestions across all features (inline completions, chat, etc.). Calculated as: total accepted suggestions ÷ total suggestions × 100%, summed across all days in the selected period."
        description="Code suggestions acceptance rate"
        value={isLoading ? "..." : acceptanceAverage.toFixed(0) + "%"}
      ></StatsCard>
      <StatsCard
        title="Active users"
        tip="Average number of users with any daily Copilot activity over the selected period. Calculated as: sum of daily active users ÷ number of days. Includes passive activity (e.g. receiving a suggestion) and engagement (e.g. accepting a suggestion or prompting chat)."
        description="Average daily active users"
        value={isLoading ? "..." : averageActiveUsers.toFixed(0) + ""}
      ></StatsCard>
      <StatsCard
        title="Adoption rate"
        tip="Percentage of licensed Copilot seats that are actively used. Calculated as: active seats ÷ total seats × 100%. A seat is considered active if the user had any Copilot activity in the last 30 days."
        description="Percentage of active seats"
        value={isLoading ? "..." : adoptionRate.toFixed(0) + "%"}
      ></StatsCard>
      <Overview />
    </div>
  );
};

export const Overview = () => {
  const Item = ({ label, value }: { label: string; value: number }) => (
    <div className="flex-1 flex flex-row gap-2">
      <div className="text-xs flex-1 text-muted-foreground">{label}</div>
      <div className="text-xs ">{value}</div>
    </div>
  );

  const { filteredSeatsData, isLoading } = useDashboard();
  let total_seats = 0;
  let total_active_seats = 0;

  if (
    filteredSeatsData &&
    typeof filteredSeatsData.total_seats === "number" &&
    typeof filteredSeatsData.total_active_seats === "number"
  ) {
    total_seats = filteredSeatsData.total_seats;
    total_active_seats = filteredSeatsData.total_active_seats;
  }

  return (
    <Card className="col-span-1">
      <ChartHeader
        title={"Seat information"}
        description={"Overview of GitHub Copilot seats"}
        tip={
          "A seat is active if the user had any Copilot activity within the last 30 days. Inactive means no recorded activity or last activity was more than 30 days ago."
        }
      />
      <CardContent className=" flex flex-col gap-2">
        {isLoading ? (
          <>
            <div className="flex-1 flex flex-row gap-2">
              <div className="text-xs flex-1 text-muted-foreground">
                Total seats
              </div>
              <div className="text-xs">...</div>
            </div>
            <div className="flex-1 flex flex-row gap-2">
              <div className="text-xs flex-1 text-muted-foreground">
                Active seats
              </div>
              <div className="text-xs">...</div>
            </div>
            <div className="flex-1 flex flex-row gap-2">
              <div className="text-xs flex-1 text-muted-foreground">
                Inactive seats
              </div>
              <div className="text-xs">...</div>
            </div>
          </>
        ) : (
          <>
            <Item label="Total seats" value={total_seats} />
            <Item label="Active seats" value={total_active_seats} />
            <Item
              label="Inactive seats"
              value={total_seats - total_active_seats}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};
