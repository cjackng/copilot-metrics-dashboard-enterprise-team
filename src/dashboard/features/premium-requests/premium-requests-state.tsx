"use client";

import { PropsWithChildren } from "react";
import { CopilotSeatsData } from "@/features/common/models";
import { proxy, useSnapshot } from "valtio";
import { PremiumRequestUsage } from '@/features/common/models';
import { UserUsageData } from "@/features/common/models";
import { DropdownFilterItem } from "@/features/dashboard/dashboard-state";

interface IProps extends PropsWithChildren {
  premiumRequestUsages: PremiumRequestUsage[];
  latestUpdateTime: Date | null;
  selectedMonth?: string;
  startDate: string;
  endDate: string;
  isCrossMonthRange: boolean;
}

export type { DropdownFilterItem };

class PremiumRequestsState {
  public seatsData: CopilotSeatsData = {} as CopilotSeatsData;
  public premiumRequestUsages: PremiumRequestUsage[] = [];
  public userUsageData: UserUsageData[] = [];
  public filteredUserUsageData: UserUsageData[] = [];
  public teams: DropdownFilterItem[] = [];
  public startDate: string = "";
  public endDate: string = "";
  public selectedMonth: string = "";
  public latestUpdateTime: Date | null = null;

  public initData(
    premiumRequestUsages: PremiumRequestUsage[],
    latestUpdateTime: Date | null,
    startDate: string,
    endDate: string,
    selectedMonth?: string,
    isCrossMonthRange = false
  ): void {
    this.premiumRequestUsages = premiumRequestUsages;
    this.latestUpdateTime = latestUpdateTime;
    this.selectedMonth = selectedMonth || this.getCurrentMonth();
    this.userUsageData = this.getUserUsageData(premiumRequestUsages, isCrossMonthRange);
    this.startDate = startDate;
    this.endDate = endDate;

    // Preserve existing team selections when re-initializing (e.g. date change)
    const prevSelections = new Map(this.teams.map((t) => [t.value, t.isSelected]));
    this.teams = this.extractUniqueTeams(premiumRequestUsages).map((t) => ({
      ...t,
      isSelected: prevSelections.get(t.value) ?? false,
    }));

    // Re-apply team filter on new data
    this.applyTeamFilter();
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  public setSelectedMonth(month: string): void {
    this.selectedMonth = month;
  }

  public filterTeam(team: string): void {
    const item = this.teams.find((t) => t.value === team);
    if (item) {
      item.isSelected = !item.isSelected;
      this.applyTeamFilter();
    }
  }

  public batchFilterTeams(names: string[], selected: boolean): void {
    const nameSet = new Set(names);
    this.teams.forEach((item) => {
      if (nameSet.has(item.value)) item.isSelected = selected;
    });
    this.applyTeamFilter();
  }

  public resetTeamFilters(): void {
    this.teams.forEach((item) => (item.isSelected = false));
    this.filteredUserUsageData = this.userUsageData;
  }

  private applyTeamFilter(): void {
    const selectedTeams = this.teams.filter((t) => t.isSelected).map((t) => t.value);
    if (selectedTeams.length === 0) {
      this.filteredUserUsageData = this.userUsageData;
    } else {
      this.filteredUserUsageData = this.userUsageData.filter((user) =>
        user.team?.some((team) => selectedTeams.includes(team)),
      );
    }
  }

  private extractUniqueTeams(data: PremiumRequestUsage[]): DropdownFilterItem[] {
    const teamSet = new Set<string>();
    data.forEach((usage) => {
      usage.team?.split(',').forEach((team) => {
        const trimmed = team.trim();
        if (trimmed) teamSet.add(trimmed);
      });
    });
    return Array.from(teamSet)
      .sort()
      .map((name) => ({ value: name, isSelected: false }));
  }

  public updateUsageData(usageData: PremiumRequestUsage[], isCrossMonthRange = false): void {
    this.premiumRequestUsages = usageData;
    this.userUsageData = this.getUserUsageData(usageData, isCrossMonthRange);
    this.applyTeamFilter();
  }

  public getUserUsageData = (usageData: PremiumRequestUsage[], isCrossMonthRange: boolean): UserUsageData[] => {
    const userUsageMap = new Map<string, UserUsageData>();
    usageData?.forEach(usage => {
      const isRequestType = usage.unit_type === 'requests';
      const isCreditType = usage.unit_type === 'ai-credits';
      if (!userUsageMap.has(usage.username)) {
        userUsageMap.set(usage.username, {
          user: usage.username,
          userDisplayName: usage.display_username || "",
          totalRequestQuantity: null, 
          totalRequestQuota: null,
          totalCreditQuantity: null,
          totalGrossAmount: null,
          team: []
        });
      }
      const userData = userUsageMap.get(usage.username)!;
      if (isRequestType) {
        userData.totalRequestQuantity = (userData.totalRequestQuantity ?? 0) + Number(usage.quantity);
        if (!isCrossMonthRange) {
          userData.totalRequestQuota = usage.total_monthly_quota;
        }
      }
      if (isCreditType) {
        userData.totalCreditQuantity = (userData.totalCreditQuantity ?? 0) + Number(usage.quantity);
        userData.totalGrossAmount = (userData.totalGrossAmount ?? 0) + Number(usage.gross_amount);
      }
      if (!userData.userDisplayName) {
        userData.userDisplayName = usage.display_username || "";
      }
      usage.team?.split(',').forEach(team => {
        const trimmedTeam = team.trim();
        if (trimmedTeam && !userData.team?.includes(trimmedTeam)) {
          userData.team?.push(trimmedTeam);
        }
      });
    });

    return Array.from(userUsageMap.values());
  };

}

export const dashboardStore = proxy(new PremiumRequestsState());

export const useDashboard = () => {
  return useSnapshot(dashboardStore, { sync: true }) as PremiumRequestsState;
};

export const DataProvider = ({
  children,
  premiumRequestUsages,
  latestUpdateTime,
  selectedMonth,
  startDate,
  endDate,
  isCrossMonthRange,
}: IProps) => {
  dashboardStore.initData(premiumRequestUsages, latestUpdateTime, startDate, endDate, selectedMonth, isCrossMonthRange);
  return <>{children}</>;
};
