"use client";

import { PropsWithChildren } from "react";
import { CopilotSeatsData } from "@/features/common/models";
import { proxy, useSnapshot } from "valtio";
import { PremiumRequestUsage } from '@/features/common/models';
import { UserUsageData } from "@/features/common/models";

interface IProps extends PropsWithChildren {
  premiumRequestUsages: PremiumRequestUsage[];
  latestUpdateTime: string;
  selectedMonth?: string;
  startDate: string;
  endDate: string;
}

export interface DropdownFilterItem {
  value: string;
  isSelected: boolean;
}

class PremiumRequestsState {
  public seatsData: CopilotSeatsData = {} as CopilotSeatsData;
  public premiumRequestUsages: PremiumRequestUsage[] = [];
  public userUsageData: UserUsageData[] = [];
  public startDate: string = "";
  public endDate: string = "";
  public selectedMonth: string = "";
  public latestUpdateTime: string = "";

  public initData(
    premiumRequestUsages: PremiumRequestUsage[],
    latestUpdateTime: string,
    startDate: string,
    endDate: string,
    selectedMonth?: string
  ): void {
    this.premiumRequestUsages = premiumRequestUsages;
    this.latestUpdateTime = latestUpdateTime;
    this.selectedMonth = selectedMonth || this.getCurrentMonth();
    this.userUsageData = this.getUserUsageData(premiumRequestUsages);
    this.startDate = startDate;
    this.endDate = endDate;
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  public setSelectedMonth(month: string): void {
    this.selectedMonth = month;
  }

  public updateUsageData(usageData: PremiumRequestUsage[]): void {
    this.premiumRequestUsages = usageData;
    this.userUsageData = this.getUserUsageData(usageData);
  }

  public getUserUsageData = (usageData: PremiumRequestUsage[]): UserUsageData[] => {
    const userUsageMap = new Map<string, UserUsageData>();
    usageData?.forEach(usage => {
      if (!userUsageMap.has(usage.username)) {
        userUsageMap.set(usage.username, {
          user: usage.username,
          userDisplayName: usage.display_username || "",
          totalRequestQuantity: 0,
          totalRequestQuota: usage.total_monthly_quota,
          team: []
        });
      }
      const userData = userUsageMap.get(usage.username)!;
      userData.totalRequestQuantity += Number(usage.quantity);
      if (userData.userDisplayName === "") {
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
  endDate
}: IProps) => {
  dashboardStore.initData(premiumRequestUsages, latestUpdateTime, startDate, endDate, selectedMonth);
  return <>{children}</>;
};
