"use client";

import { PropsWithChildren } from "react";
import {
  CopilotUsageOutput, CopilotUsageOutputResponse, EnterpriseTeam
} from "@/features/common/models";
import { format, parseISO, subDays } from "date-fns";

import { proxy, useSnapshot } from "valtio";

import { Member } from "@/services/enterprise-members-service";

interface IProps extends PropsWithChildren {
  copilotUsages: CopilotUsageOutputResponse;
  memberTeamsData: Map<string, Member>;
  enterpriseTeams: EnterpriseTeam[];
  lastUpdatedTime?: string | null;
  filter?: {
    startDate?: Date | string;
    endDate?: Date | string;
    date?: string;
    enterprise?: string;
    organization?: string;
  };
}

export interface DropdownFilterItem {
  value: string;
  isSelected: boolean;
}


class DashboardState {
  public filteredData: Map<string, CopilotUsageOutput[]> = new Map();
  public displayData: CopilotUsageOutput[] = [];
  public teams: DropdownFilterItem[] = [];
  public hideWeekends: boolean = false;
  public days: number = 28;
  public isLoading: boolean = false;
  public lastUpdatedTime: string | null = null;
  public isDateRangeMode: boolean = false;

  public memberTeamsData: Map<string, Member> = new Map();

  private apiData: Map<string, CopilotUsageOutput[]> = new Map();
  private teamFilteredData: Map<string, CopilotUsageOutput[]> = new Map();
  private hasPendingTeamChanges: boolean = false; // Track if teams have changed
  private currentFilter: {
    startDate?: Date | string;
    endDate?: Date | string;
    enterprise?: string;
    organization?: string;
  } = {};

  public initData(
    data: CopilotUsageOutputResponse,
    memberTeamsData: Map<string, Member>,
    enterpriseTeams: EnterpriseTeam[],
    lastUpdatedTime?: string | null,
    filter?: {
      startDate?: Date | string;
      endDate?: Date | string;
      enterprise?: string;
      organization?: string;
    }
  ): void {
    this.apiData = new Map(data.copilotUsages);
    this.teamFilteredData = new Map(data.copilotUsages);
    this.lastUpdatedTime = lastUpdatedTime ?? null;
    this.isDateRangeMode = !!(filter?.startDate && filter?.endDate);
    this.applyFilters();
    this.memberTeamsData = memberTeamsData;
    this.teams = this.extractUniqueTeams(enterpriseTeams);
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

  public selectAllTeams(): void {
    this.teams.forEach((item) => (item.isSelected = true));
    this.applyFilters();
    this.hasPendingTeamChanges = true;
  }

  public clearAllTeams(): void {
    this.teams.forEach((item) => (item.isSelected = false));
    this.applyFilters();
    this.hasPendingTeamChanges = true;
  }

  public batchFilterTeams(names: string[], selected: boolean): void {
    const nameSet = new Set(names);
    this.teams.forEach((item) => {
      if (nameSet.has(item.value)) {
        item.isSelected = selected;
      }
    });
    this.applyFilters();
    this.hasPendingTeamChanges = true;
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
      if (selectedTeams.length > 0) {
        this.teamFilteredData = new Map();
        this.apiData.forEach((value, key) => {
          if (this.memberTeamsData && this.memberTeamsData.size > 0 && this.memberTeamsData.has(key)) {
            if (this.memberTeamsData.get(key)?.teamNames.some((teamName) => selectedTeams.includes(teamName))) {
              this.teamFilteredData.set(key, value);
            }
          }
        });
      } else {
        this.teamFilteredData = new Map(this.apiData);
      }
      this.applyFilters();
    } catch (error) {
      console.error("Failed to refresh data:", error);
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

    // Refresh data from server (no URL changes)
    try {
      await this.refreshDataWithTeams([]);
    } catch (error) {
      console.error("Failed to refresh data with teams:", error);
      // Optionally, notify the user about the error (e.g., set an error state or trigger a UI notification)
    }
  }

  public onDaysChange(days: number): void {
    this.days = days;
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredData = this.filterData(this.hideWeekends);
    this.displayData = this.calculateDisplayData();
  }

  private calculateDisplayData(): CopilotUsageOutput[] {
    const allItems: CopilotUsageOutput[] = [];
    this.filteredData.forEach((userItems) => allItems.push(...userItems));

    const grouped = allItems.reduce((acc, item) => {
      const key = item.day;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, CopilotUsageOutput[]>);

    return Object.entries(grouped)
      .map(([key, items]) => {
        const merged: CopilotUsageOutput = {
          day: key,
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
          chat_requests_plan: 0,
          code_completion_suggestions: 0,
          code_completion_acceptances: 0,
          code_completion_lines_suggested: 0,
          code_completion_lines_accepted: 0,
          total_lines_added: 0,
          total_lines_deleted: 0,
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
          merged.chat_requests_plan! += item.chat_requests_plan ?? 0;
          merged.code_completion_suggestions! += item.code_completion_suggestions ?? 0;
          merged.code_completion_acceptances! += item.code_completion_acceptances ?? 0;
          merged.code_completion_lines_suggested! += item.code_completion_lines_suggested ?? 0;
          merged.code_completion_lines_accepted! += item.code_completion_lines_accepted ?? 0;
          merged.total_lines_added += item.total_lines_added ?? 0;
          merged.total_lines_deleted += item.total_lines_deleted ?? 0;
          if (item.total_chat_generations !== undefined) {
            merged.total_chat_generations =
              (merged.total_chat_generations ?? 0) + item.total_chat_generations;
          }
        });

        return merged;
      })
      .sort((a, b) => a.day.localeCompare(b.day));
  }

  private extractUniqueTeams(enterpriseTeams: EnterpriseTeam[]): DropdownFilterItem[] {
    const uniqueTeamNames = Array.from(
      new Set(enterpriseTeams.map((team) => team.name).filter((teamName) => teamName))
    ).sort((a, b) => a.localeCompare(b));

    return uniqueTeamNames.map((teamName) => ({
      value: teamName,
      isSelected: false,
    }));
  }

  private filterData(hideWeekends: boolean): Map<string, CopilotUsageOutput[]> {
    const result = new Map<string, CopilotUsageOutput[]>();

    this.teamFilteredData.forEach((userItems, user) => {
      let items: CopilotUsageOutput[] = [...userItems];
      
      if (hideWeekends) {
        items = items.filter((item) => {
          const day = new Date(item.day).getDay();
          return day !== 0 && day !== 6;
        });
      }

      result.set(user, items);
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
  memberTeamsData,
  enterpriseTeams,
  lastUpdatedTime,
  filter,
}: IProps) => {
  dashboardStore.initData(copilotUsages, memberTeamsData, enterpriseTeams, lastUpdatedTime, filter);
  return <>{children}</>;
};
