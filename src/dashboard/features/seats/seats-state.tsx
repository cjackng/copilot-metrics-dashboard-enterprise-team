"use client";

import { PropsWithChildren } from "react";
import { proxy, useSnapshot } from "valtio";
import { SeatSnapshotRow, SeatsDBResult } from "@/services/copilot-seat-service";
import { DropdownFilterItem } from "@/features/dashboard/dashboard-state";

export type { DropdownFilterItem };

interface IProps extends PropsWithChildren {
  dbResult: SeatsDBResult;
  selectedDate: string;
}

class SeatsState {
  public seats: SeatSnapshotRow[] = [];
  public filteredSeats: SeatSnapshotRow[] = [];
  public teams: DropdownFilterItem[] = [];
  public total_seats: number = 0;
  public total_active_seats: number = 0;
  public snapshot_date: string | null = null;
  public snapshot_time: Date | null = null;
  public last_update_time: Date | null = null;
  public selectedDate: string = "";

  public initData(dbResult: SeatsDBResult, selectedDate: string): void {
    this.seats = dbResult.seats;
    this.total_seats = dbResult.total_seats;
    this.total_active_seats = dbResult.total_active_seats;
    this.snapshot_date = dbResult.snapshot_date;
    this.snapshot_time = dbResult.snapshot_time;
    this.last_update_time = dbResult.last_update_time;
    this.selectedDate = selectedDate;
    // extractUniqueTeams already preserves isSelected via currentSelected
    this.teams = this.extractUniqueTeams(dbResult.seats);
    // Re-apply team filter on new seat data
    this.applyTeamFilter();
  }

  private extractUniqueTeams(seats: SeatSnapshotRow[]): DropdownFilterItem[] {
    const teamSet = new Set<string>();
    for (const seat of seats) {
      if (seat.team && seat.team !== "null" && seat.team !== "undefined") {
        teamSet.add(seat.team);
      }
    }
    const currentSelected = new Set(this.teams.filter((t) => t.isSelected).map((t) => t.value));
    return Array.from(teamSet)
      .sort()
      .map((t) => ({ value: t, isSelected: currentSelected.has(t) }));
  }

  public filterTeam(value: string): void {
    const team = this.teams.find((t) => t.value === value);
    if (team) team.isSelected = !team.isSelected;
    this.applyTeamFilter();
  }

  public batchFilterTeams(names: string[], selected: boolean): void {
    for (const team of this.teams) {
      if (names.includes(team.value)) team.isSelected = selected;
    }
    this.applyTeamFilter();
  }

  public resetTeamFilters(): void {
    for (const team of this.teams) {
      team.isSelected = false;
    }
    this.filteredSeats = this.seats;
  }

  private applyTeamFilter(): void {
    const selected = this.teams.filter((t) => t.isSelected).map((t) => t.value);
    if (selected.length === 0) {
      this.filteredSeats = this.seats;
    } else {
      this.filteredSeats = this.seats.filter((s) => s.team && selected.includes(s.team));
    }
  }
}

export const seatsStore = proxy(new SeatsState());

export const useSeats = () => {
  return useSnapshot(seatsStore, { sync: true }) as SeatsState;
};

export const DataProvider = ({ children, dbResult, selectedDate }: IProps) => {
  seatsStore.initData(dbResult, selectedDate);
  return <>{children}</>;
};

