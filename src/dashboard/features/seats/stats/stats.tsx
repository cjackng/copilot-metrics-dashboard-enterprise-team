"use client";
import { useDashboard } from "@/features/seats/seats-state";
import StatsCard from "./stats-card";

export const Stats = () => {
  const { seatsData } = useDashboard();
  const total_inactive_seats = seatsData.total_seats - seatsData.total_active_seats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 col-span-4">
      <StatsCard
        title="Total seats"
        tip="Total number of Copilot licenses assigned to users in the enterprise."
        description="Total assigned seats"
        value={seatsData.total_seats > 0 ? Math.round(seatsData.total_seats).toLocaleString() : "0"}
      ></StatsCard>
      <StatsCard
        title="Active seats"
        tip="Seats where the assigned user had any Copilot activity within the last 30 days."
        description="Total active seats"
        value={seatsData.total_active_seats > 0 ? Math.round(seatsData.total_active_seats).toLocaleString() : "0"}
      ></StatsCard>
      <StatsCard
        title="Inactive seats"
        tip="Seats where the assigned user had no Copilot activity in the last 30 days, or has never used Copilot. Calculated as: total seats − active seats."
        description="Total inactive seats"
        value={total_inactive_seats > 0 ? Math.round(total_inactive_seats).toLocaleString() : "0"}
      ></StatsCard>
      <StatsCard
        title="Adoption rate"
        tip="Percentage of assigned Copilot seats that are actively used. Calculated as: active seats ÷ total seats × 100%."
        description="Percentage of active seats"
        value={seatsData.total_seats > 0 ? Math.round((seatsData.total_active_seats / seatsData.total_seats) * 100 ).toLocaleString() + "%" : "0%"}
      ></StatsCard>
    </div>
  );
};


