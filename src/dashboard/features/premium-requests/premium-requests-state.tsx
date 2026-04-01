"use client";

import { PropsWithChildren } from "react";
import { CopilotSeatsData } from "@/features/common/models";
import { proxy, useSnapshot } from "valtio";
import { PremiumRequestUsage } from '@/features/common/models';


interface IProps extends PropsWithChildren {
  copilotSeats: CopilotSeatsData;
  premiumRequestUsages: PremiumRequestUsage[];
}

export interface DropdownFilterItem {
  value: string;
  isSelected: boolean;
}

class PremiumRequestsState {
  public seatsData: CopilotSeatsData = {} as CopilotSeatsData;
  public premiumRequestUsages: PremiumRequestUsage[] = [];

  public initData(
    seatsData: CopilotSeatsData,
    premiumRequestUsages: PremiumRequestUsage[]
  ): void {
    this.seatsData = seatsData;
    this.premiumRequestUsages = premiumRequestUsages;
  }

}

export const dashboardStore = proxy(new PremiumRequestsState());

export const useDashboard = () => {
  return useSnapshot(dashboardStore, { sync: true }) as PremiumRequestsState;
};

export const DataProvider = ({
  children,
  copilotSeats,
  premiumRequestUsages
}: IProps) => {
  dashboardStore.initData(copilotSeats, premiumRequestUsages);
  return <>{children}</>;
};
