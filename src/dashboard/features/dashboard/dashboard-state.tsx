"use client";

import { PropsWithChildren } from "react";
import {
  CopilotUsageOutput, CopilotUsageOutputResponse
} from "@/features/common/models";
import { formatDate } from "@/utils/helpers";
import { format, parseISO, subDays } from "date-fns";

import { proxy, useSnapshot } from "valtio";

import { groupByTimeFrame } from "@/utils/data-mapper";
import { CopilotSeatsData } from "../common/models";
import {
  refreshSeatsData,
} from "@/services/dashboard-actions";
import { Member } from "@/services/enterprise-members-service";

interface IProps extends PropsWithChildren {
  copilotUsages: CopilotUsageOutputResponse;
  seatsData: CopilotSeatsData;
  teamsData: Map<string, Member>;
  filter?: {
    startDate?: Date;
    endDate?: Date;
    date?: string;
    enterprise?: string;
    organization?: string;
  };
}

export interface DropdownFilterItem {
  value: string;
  isSelected: boolean;
}

export type TimeFrame = "daily" | "weekly";

class DashboardState {
  public filteredData: Map<string, CopilotUsageOutput[]> = new Map();
  public displayData: CopilotUsageOutput[] = [];
  public teams: DropdownFilterItem[] = [];
  public timeFrame: TimeFrame = "daily";
  public hideWeekends: boolean = false;
  public days: number = 28;
  public isLoading: boolean = false;
  public reportStartDay: string = "";
  public reportEndDay: string = "";

  public seatsData: CopilotSeatsData = {} as CopilotSeatsData;
  public teamsData: Map<string, Member> = new Map();

  private apiData: Map<string, CopilotUsageOutput[]> = new Map();
  private teamFilteredData: Map<string, CopilotUsageOutput[]> = new Map();
  private hasPendingTeamChanges: boolean = false; // Track if teams have changed
  private currentFilter: {
    startDate?: Date;
    endDate?: Date;
    enterprise?: string;
    organization?: string;
  } = {};

  public get filteredSeatsData(): CopilotSeatsData {
    // Return the server-filtered seats data directly
    // The filtering is now done on the server side when team filters are applied
    return this.seatsData;
  }

  public initData(
    data: CopilotUsageOutputResponse,
    seatsData: CopilotSeatsData,
    teamsData: Map<string, Member>,
    filter?: {
      startDate?: Date;
      endDate?: Date;
      enterprise?: string;
      organization?: string;
    }
  ): void {
    this.apiData = new Map(data.copilotUsages);
    this.teamFilteredData = new Map(data.copilotUsages);
    this.reportStartDay = data.report_start_day;
    this.reportEndDay = data.report_end_day;
    this.onTimeFrameChange(this.timeFrame);
    this.seatsData = seatsData;
    this.teamsData = teamsData;
    this.teams = this.extractUniqueTeams();
    // Store current filter for data refreshing
    if (filter) {
      this.currentFilter = filter;
    }
  }

  public filterTeam(team: string): void {
    const item = this.teams.find((t) => t.value === team);
    if (item) {
      item.isSelected = !item.isSelected;
      this.applyFilters();
      this.hasPendingTeamChanges = true;
    }
  }

  public async refreshTeamDataIfNeeded(): Promise<void> {
    if (this.hasPendingTeamChanges) {
      // Get selected teams for server request
      const selectedTeams = this.teams
        .filter((t) => t.isSelected)
        .map((t) => t.value);

      // Refresh data from server in the background
      await this.refreshDataWithTeams(selectedTeams);

      // Reset pending changes flag
      this.hasPendingTeamChanges = false;
    }
  }

  private async refreshDataWithTeams(selectedTeams: string[]): Promise<void> {
    this.isLoading = true;

    try {
      // Refresh both metrics data and seats data in parallel
      const [seatsResult] = await Promise.all([
        refreshSeatsData({
          date: this.currentFilter.endDate, // Use endDate for seats filtering
          enterprise: this.currentFilter.enterprise,
          organization: this.currentFilter.organization,
          teams: selectedTeams,
        }),
      ]);

      if (selectedTeams.length > 0) {
        this.teamFilteredData = new Map();
        this.apiData.forEach((value, key) => {
          if (this.teamsData && this.teamsData.size > 0 && this.teamsData.has(key)) {
            if (this.teamsData.get(key)?.teams.some((team) => selectedTeams.includes(team))) {
              this.teamFilteredData.set(key, value);
            }
          }
        });
      } else {
        this.teamFilteredData = new Map(this.apiData);
      }
      this.applyFilters();

      if (seatsResult.success && seatsResult.data) {
        // Update the seats data
        this.seatsData = seatsResult.data;
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
      // Could add error handling UI here
    } finally {
      this.isLoading = false;
    }
  }

  public toggleWeekendFilter(hide: boolean): void {
    this.hideWeekends = hide;
    this.applyFilters();
  }

  public async resetAllFilters(): Promise<void> {
    this.teams.forEach((item) => (item.isSelected = false));
    this.hideWeekends = false;
    this.days = 28;
    this.hasPendingTeamChanges = false; // Reset pending changes
    this.applyFilters();

    // Refresh both metrics and seats data from server (no URL changes)
    try {
      await this.refreshDataWithTeams([]);
    } catch (error) {
      console.error("Failed to refresh data with teams:", error);
      // Optionally, notify the user about the error (e.g., set an error state or trigger a UI notification)
    }
  }

  public onTimeFrameChange(timeFrame: TimeFrame): void {
    this.timeFrame = timeFrame;
    this.applyFilters();
  }

  public onDaysChange(days: number): void {
    this.days = days;
    this.timeFrame = "daily";
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredData = this.aggregatedDataByTimeFrame(this.hideWeekends);
    this.displayData = this.calculateDisplayData();
  }

  private calculateDisplayData(): CopilotUsageOutput[] {
    // Flatten all users' already-aggregated data into one array
    const allItems: CopilotUsageOutput[] = [];
    this.filteredData.forEach((userItems) => allItems.push(...userItems));

    // Group by time_frame_display (set by aggregatedDataByTimeFrame)
    const grouped = allItems.reduce((acc, item) => {
      const key = item.time_frame_display || item.day;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, CopilotUsageOutput[]>);

    return Object.entries(grouped)
      .map(([key, items]) => {
        const merged: CopilotUsageOutput = {
          day: items[0].day,
          time_frame_week: items[0].time_frame_week,
          time_frame_display: key,
          total_active_users: 0,
          total_ide_engaged_users: 0,
          total_chat_engaged_users: 0,
          total_cli_engaged_users: 0,
          total_code_suggestions: 0,
          total_code_acceptances: 0,
          total_code_lines_suggested: 0,
          total_code_lines_accepted: 0,
          total_chats: 0,
          total_accepted_chats: 0,
          total_user_initiated_chat_requests: 0,
          chat_requests_ask: 0,
          chat_requests_inline: 0,
          chat_requests_edit: 0,
          chat_requests_agent: 0,
          chat_requests_custom: 0,
          code_completion_suggestions: 0,
          code_completion_acceptances: 0,
          code_completion_lines_suggested: 0,
          code_completion_lines_accepted: 0,
        };
        
        items.forEach((item) => {
          merged.total_active_users += item.total_active_users;
          merged.total_ide_engaged_users += item.total_ide_engaged_users;
          merged.total_chat_engaged_users += item.total_chat_engaged_users;
          merged.total_cli_engaged_users += item.total_cli_engaged_users;
          merged.total_code_suggestions += item.total_code_suggestions;
          merged.total_code_acceptances += item.total_code_acceptances;
          merged.total_code_lines_suggested += item.total_code_lines_suggested;
          merged.total_code_lines_accepted += item.total_code_lines_accepted;
          merged.total_chats += item.total_chats;
          merged.total_accepted_chats += item.total_accepted_chats;
          merged.total_user_initiated_chat_requests! += item.total_user_initiated_chat_requests ?? 0;
          merged.chat_requests_ask! += item.chat_requests_ask ?? 0;
          merged.chat_requests_inline! += item.chat_requests_inline ?? 0;
          merged.chat_requests_edit! += item.chat_requests_edit ?? 0;
          merged.chat_requests_agent! += item.chat_requests_agent ?? 0;
          merged.chat_requests_custom! += item.chat_requests_custom ?? 0;
          merged.code_completion_suggestions! += item.code_completion_suggestions ?? 0;
          merged.code_completion_acceptances! += item.code_completion_acceptances ?? 0;
          merged.code_completion_lines_suggested! += item.code_completion_lines_suggested ?? 0;
          merged.code_completion_lines_accepted! += item.code_completion_lines_accepted ?? 0;
          if (item.total_chat_generations !== undefined) {
            merged.total_chat_generations =
              (merged.total_chat_generations ?? 0) + item.total_chat_generations;
          }
        });

        return merged;
      })
      .sort((a, b) => a.day.localeCompare(b.day));
  }

  private extractUniqueTeams(): DropdownFilterItem[] {
    const teams: DropdownFilterItem[] = [];

    // Use the fetched teams data instead of extracting from seats
    if (this.teamsData && this.teamsData.size > 0) {
      this.teamsData.forEach((member) => {
        if (member && member.teams && member.teams.length > 0) {
          member.teams.forEach((teamName) => {
            if (!teams.find((t) => t.value === teamName)) {
              teams.push({ value: teamName, isSelected: false });
            }
          });
        }
      });
    }

    return teams.sort((a, b) => a.value.localeCompare(b.value));
  }

  private aggregatedDataByTimeFrame(hideWeekends: boolean): Map<string, CopilotUsageOutput[]> {
    const result = new Map<string, CopilotUsageOutput[]>();

    const endDate = this.reportEndDay !== "" ? parseISO(this.reportEndDay) : new Date();
    const cutoffStr = format(subDays(endDate, this.days), "yyyy-MM-dd");

    this.teamFilteredData.forEach((userItems, user) => {
      let items = userItems.filter((item) => item.day >= cutoffStr);

      if (hideWeekends) {
        items = items.filter((item) => {
          const day = new Date(item.day).getDay();
          return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
        });
      }

      if (this.timeFrame === "daily") {
        result.set(
          user,
          items.map((item) => ({ ...item, time_frame_display: formatDate(item.day) }))
        );
        return;
      }

      const groupedByTimeFrame = items.reduce((acc, item) => {
        const label = item.time_frame_week;
        if (!acc[label]) acc[label] = [];
        acc[label].push(item);
        return acc;
      }, {} as Record<string, CopilotUsageOutput[]>);

      result.set(user, groupByTimeFrame(groupedByTimeFrame));
    });

    return result;
  }
}

export const dashboardStore = proxy(new DashboardState());

export const useDashboard = () => {
  return useSnapshot(dashboardStore, { sync: true }) as DashboardState;
};

export const DataProvider = ({
  children,
  copilotUsages,
  seatsData,
  teamsData,
  filter,
}: IProps) => {
  dashboardStore.initData(copilotUsages, seatsData, teamsData, filter);
  return <>{children}</>;
};
