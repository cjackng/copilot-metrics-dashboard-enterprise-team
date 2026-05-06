"use client";
import { useSeats } from "@/features/seats/seats-state";
import StatsCard from "./stats-card";
import { subDays } from "date-fns";

export const Stats = () => {
  const { filteredSeats, selectedDate } = useSeats();

  const thirtyDaysBeforeSelected = subDays(new Date(selectedDate), 30);
  const total_seats = filteredSeats.length;
  const total_active_seats = filteredSeats.filter(
    (s) => s.last_activity_at && new Date(s.last_activity_at) >= thirtyDaysBeforeSelected,
  ).length;
  const total_inactive_seats = total_seats - total_active_seats;

  return (
    <div className="col-span-4 flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total seats"
          tip="Total Copilot licenses assigned at the time of the snapshot."
          description="Total assigned seats"
          value={total_seats > 0 ? Math.round(total_seats).toLocaleString() : "0"}
        />
        <StatsCard
          title="Active seats"
          tip="Seats with any Copilot activity in the 30 days prior to the selected date."
          description="Total active seats"
          value={total_active_seats > 0 ? Math.round(total_active_seats).toLocaleString() : "0"}
        />
        <StatsCard
          title="Inactive seats"
          tip="Seats with no Copilot activity in the 30 days prior to the selected date. Calculation: total seats − active seats."
          description="Total inactive seats"
          value={total_inactive_seats > 0 ? Math.round(total_inactive_seats).toLocaleString() : "0"}
        />
        <StatsCard
          title="Adoption rate"
          tip="Percentage of assigned seats that are actively used. Calculation: active seats ÷ total seats × 100%."
          description="Percentage of active seats"
          value={total_seats > 0 ? Math.round((total_active_seats / total_seats) * 100).toLocaleString() + "%" : "0%"}
        />
      </div>
    </div>
  );
};
