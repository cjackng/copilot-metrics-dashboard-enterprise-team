"use client";

import { PropsWithChildren } from "react";
import { CopilotSeatsData } from "@/features/common/models";
import { proxy, useSnapshot } from "valtio";
import { Member } from "@/services/enterprise-members-service";

interface IProps extends PropsWithChildren {
  copilotSeats: CopilotSeatsData;
  members: Member[];
}

export interface DropdownFilterItem {
  value: string;
  isSelected: boolean;
}

class SeatsState {
  public seatsData: CopilotSeatsData = {} as CopilotSeatsData;
  public loginToDisplayNameMap: Record<string, string> = {};

  public initData(
    data: CopilotSeatsData,
    members: Member[]
  ): void {
    this.seatsData = data;
    this.loginToDisplayNameMap = this.getLoginToDisplayNameMap(members);
  }

  private getLoginToDisplayNameMap(members: Member[]): Record<string, string> {
    const map: Record<string, string> = {};
    members.forEach((member) => {
      map[member.login] = member.display_name;
    });
    return map;
  }

}

export const dashboardStore = proxy(new SeatsState());

export const useDashboard = () => {
  return useSnapshot(dashboardStore, { sync: true }) as SeatsState;
};

export const DataProvider = ({
  children,
  copilotSeats,
  members
}: IProps) => {
  dashboardStore.initData(copilotSeats, members);
  return <>{children}</>;
};
