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
        description="Total assigned seats"
        value={seatsData.total_seats > 0 ? Math.round(seatsData.total_seats).toLocaleString() : "0"}
      ></StatsCard>
      <StatsCard
        title="Active seats"
        description="Total active seats"
        value={seatsData.total_active_seats > 0 ? Math.round(seatsData.total_active_seats).toLocaleString() : "0"}
      ></StatsCard>
      <StatsCard
        title="Inactive seats"
        description="Total inactive seats"
        value={total_inactive_seats > 0 ? Math.round(total_inactive_seats).toLocaleString() : "0"}
      ></StatsCard>
      <StatsCard
        title="Adoption rate"
        description="Adoption rate by total active seats"
        value={seatsData.total_seats > 0 ? Math.round((seatsData.total_active_seats / seatsData.total_seats) * 100 ).toLocaleString() + "%" : "0%"}
      ></StatsCard>
    </div>
  );
};


