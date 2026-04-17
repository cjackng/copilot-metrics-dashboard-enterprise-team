import { CopilotUsageOutput } from "@/features/common/models";

export interface AcceptanceRateData {
  acceptanceRate: number;
  acceptanceLinesRate: number;
  timeFrameDisplay: string;
}

export const computeAcceptanceAverage = (
  filteredData: CopilotUsageOutput[]
): AcceptanceRateData[] => {
  const rates = filteredData.map((item) => {
    const cumulatedAccepted = item.total_code_acceptances || 0;
    const cumulatedSuggested = item.total_code_suggestions || 0;

    const acceptanceAverage =
      cumulatedSuggested !== 0
        ? (cumulatedAccepted / cumulatedSuggested) * 100
        : 0;
    
    const cumulatedLinesAccepted = item.total_code_lines_accepted || 0;
    const cumulatedLinesSuggested = item.total_code_lines_suggested || 0;

    const acceptanceLinesAverage =
      cumulatedLinesSuggested !== 0
        ? (cumulatedLinesAccepted / cumulatedLinesSuggested) * 100
        : 0;

    return {
      acceptanceRate: parseFloat(acceptanceAverage.toFixed(2)),
      acceptanceLinesRate: parseFloat(acceptanceLinesAverage.toFixed(2)),
      timeFrameDisplay: item.time_frame_display,
    };
  });

  return rates;
};

export interface ActiveUserData {
  totalUsers: number;
  totalIdeUsers: number;
  timeFrameDisplay: string;
}

export function getActiveUsers(
  filteredData: CopilotUsageOutput[]
): ActiveUserData[] {
  const rates = filteredData.map((item) => {
    return {
      totalUsers: item.total_active_users,
      totalIdeUsers: item.total_ide_engaged_users,
      timeFrameDisplay: item.time_frame_display,
    };
  });

  return rates;
}

export const computeActiveUserAverage = (
  filteredData: CopilotUsageOutput[]
) => {
  if (filteredData.length === 0) return 0;
  const activeUsersSum: number = filteredData.reduce(
    (sum: number, item: { total_active_users: number }) =>
      sum + item.total_active_users,
    0
  );
  return activeUsersSum / filteredData.length;
};

export const computeAdoptionRate = (seatsData: any) => {
  if (!seatsData || !seatsData.total_seats || seatsData.total_seats === 0) {
    return 0;
  }
  const adoptionRate =
    (seatsData.total_active_seats /
      seatsData.total_seats) *
    100;
  return adoptionRate;
};

export const computeCumulativeAcceptanceAverage = (
  filteredData: CopilotUsageOutput[]
) => {
  const totalAccepted = filteredData.reduce(
    (sum, item) => sum + (item.total_code_acceptances || 0),
    0
  );
  const totalSuggested = filteredData.reduce(
    (sum, item) => sum + (item.total_code_suggestions || 0),
    0
  );

  if (totalSuggested === 0) return 0;
  return (totalAccepted / totalSuggested) * 100;
};

export interface LineSuggestionsAndAcceptancesData {
  totalLinesAccepted: number;
  totalLinesSuggested: number;
  timeFrameDisplay: string;
}

export function totalLinesSuggestedAndAccepted(
  filteredData: CopilotUsageOutput[]
): LineSuggestionsAndAcceptancesData[] {
  const codeLineSuggestionsAndAcceptances = filteredData.map((item) => {
    return {
      totalLinesAccepted: item.total_code_lines_accepted || 0,
      totalLinesSuggested: item.total_code_lines_suggested || 0,
      timeFrameDisplay: item.time_frame_display,
    };
  });

  return codeLineSuggestionsAndAcceptances;
}

export interface SuggestionAcceptanceData {
  totalAcceptancesCount: number;
  totalSuggestionsCount: number;
  timeFrameDisplay: string;
}

export function totalSuggestionsAndAcceptances(
  filteredData: CopilotUsageOutput[]
): SuggestionAcceptanceData[] {
  const rates = filteredData.map((item) => {

    return {
      totalAcceptancesCount: item.total_code_acceptances || 0,
      totalSuggestionsCount: item.total_code_suggestions || 0,
      timeFrameDisplay: item.time_frame_display,
    };
  });

  return rates;
}

export interface ChatAcceptanceRateData {
  acceptanceChatRate: number;
  timeFrameDisplay: string;
}

export const computeChatAcceptanceAverage = (
  filteredData: CopilotUsageOutput[]
): ChatAcceptanceRateData[] => {
  const rates = filteredData.map((item) => {
    const totalGenerated = item.total_chat_generations ?? item.total_chats;
    const acceptanceRate =
      totalGenerated !== 0
        ? (item.total_accepted_chats / totalGenerated) * 100
        : 0;

    return {
      acceptanceChatRate: parseFloat(acceptanceRate.toFixed(2)),
      timeFrameDisplay: item.time_frame_display
    };
  });

  return rates;
};

export interface ChatAcceptanceData {
  totalChats: number;
  totalAcceptedChats: number;
  timeFrameDisplay: string;
}

export function totalChatsAndAcceptances(
  filteredData: CopilotUsageOutput[]
): ChatAcceptanceData[] {
  const rates = filteredData.map((item) => {

    return {
      totalChats: item.total_chats,
      totalAcceptedChats: item.total_accepted_chats,
      timeFrameDisplay: item.time_frame_display
    };
  });

  return rates;
}

export interface AvgChatRequestsPerActiveUserData {
  avgChatRequests: number;
  timeFrameDisplay: string;
}

export function computeAvgChatRequestsPerActiveUser(
  filteredData: CopilotUsageOutput[]
): AvgChatRequestsPerActiveUserData[] {
  return filteredData.map((item) => {
    const requests = item.total_user_initiated_chat_requests ?? 0;
    const avg =
      item.total_active_users > 0
        ? parseFloat((requests / item.total_active_users).toFixed(2))
        : 0;
    return {
      avgChatRequests: avg,
      timeFrameDisplay: item.time_frame_display,
    };
  });
}

export interface RequestsPerChatModeData {
  ask: number;
  inline: number;
  edit: number;
  agent: number;
  custom: number;
  timeFrameDisplay: string;
}

export function getRequestsPerChatMode(
  filteredData: CopilotUsageOutput[]
): RequestsPerChatModeData[] {
  return filteredData.map((item) => ({
    ask: item.chat_requests_ask ?? 0,
    inline: item.chat_requests_inline ?? 0,
    edit: item.chat_requests_edit ?? 0,
    agent: item.chat_requests_agent ?? 0,
    custom: item.chat_requests_custom ?? 0,
    timeFrameDisplay: item.time_frame_display,
  }));
}
