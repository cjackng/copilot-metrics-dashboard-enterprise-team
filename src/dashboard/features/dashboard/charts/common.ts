import { CopilotUsageOutput } from "@/features/common/models";
import { formatDate } from "@/utils/helpers";

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
      timeFrameDisplay: formatDate(item.day),
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

export interface codeCompletionSuggestionAcceptanceData {
  acceptedCompletions: number;
  suggestedCompletions: number;
  timeFrameDisplay: string;
}

export function codeCompletionSuggestionsAndAcceptances(
  filteredData: CopilotUsageOutput[]
): codeCompletionSuggestionAcceptanceData[] {
  return filteredData.map((item) => ({
    suggestedCompletions: item.code_completion_suggestions ?? 0,
    acceptedCompletions: item.code_completion_acceptances ?? 0,
    timeFrameDisplay: formatDate(item.day),
  }));
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
      timeFrameDisplay: formatDate(item.day),
    };
  });
}

export interface RequestsPerChatModeData {
  ask: number;
  inline: number;
  edit: number;
  agent: number;
  custom: number;
  plan: number;
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
    plan: item.chat_requests_plan ?? 0,
    timeFrameDisplay: formatDate(item.day),
  }));
}

export interface CodeCompletionAcceptanceRateData {
  acceptanceRate: number;
  timeFrameDisplay: string;
}

export function computeCodeCompletionAcceptanceRate(
  filteredData: CopilotUsageOutput[]
): CodeCompletionAcceptanceRateData[] {
  return filteredData.map((item) => {
    const suggestions = item.code_completion_suggestions ?? 0;
    const acceptances = item.code_completion_acceptances ?? 0;
    const acceptanceRate = suggestions > 0 ? (acceptances / suggestions) * 100 : 0;
    return {
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      timeFrameDisplay: formatDate(item.day),
    };
  });
}

export const computeTotalLinesAdded = (
  filteredData: CopilotUsageOutput[]
): number => {
  return filteredData.reduce(
    (sum, item) => sum + (item.total_lines_added ?? 0),
    0
  );
};

export const computeTotalLinesDeleted = (
  filteredData: CopilotUsageOutput[]
): number => {
  return filteredData.reduce(
    (sum, item) => sum + (item.total_lines_deleted ?? 0),
    0
  );
};

export function getMostUsedModel(displayData: CopilotUsageOutput[]): string {
  const top = getTopModels(displayData, 1);
  return top.length > 0 ? top[0].model : "N/A";
}

export interface TopModelEntry {
  model: string;
  interactions: number;
}

export function getTopModels(
  displayData: CopilotUsageOutput[],
  count: number
): TopModelEntry[] {
  const modelMap: Record<string, number> = {};
  for (const item of displayData) {
    for (const mf of item.totals_by_model_feature ?? []) {
      modelMap[mf.model] = (modelMap[mf.model] ?? 0) + mf.user_initiated_interaction_count;
    }
  }
  return Object.entries(modelMap)
    .map(([model, interactions]) => ({ model, interactions }))
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, count);
}

export interface DailyLinesData {
  added: number;
  deleted: number;
  timeFrameDisplay: string;
}

export function getDailyLinesAddedDeleted(
  displayData: CopilotUsageOutput[]
): DailyLinesData[] {
  return displayData.map((item) => ({
    added: item.total_lines_added ?? 0,
    deleted: item.total_lines_deleted ?? 0,
    timeFrameDisplay: formatDate(item.day),
  }));
}

// Feature name to display label mapping for user-initiated code changes (per-feature chart)
const USER_INITIATED_FEATURES = [
  { key: "code_completion", label: "Completions" },
  { key: "chat_panel_ask_mode", label: "Ask" },
  { key: "chat_inline", label: "Inline" },
  { key: "chat_panel_agent_mode", label: "Agent" },
  { key: "chat_panel_custom_mode", label: "Custom" },
] as const;

// Agent-initiated features: agent edit
const AGENT_INITIATED_FEATURE_KEYS = new Set([
  "agent_edit",
]);

export interface CodeChangesByFeatureData {
  feature: string;
  suggested: number;
  added: number;
}

export function getUserInitiatedCodeChangesByFeature(
  displayData: CopilotUsageOutput[]
): CodeChangesByFeatureData[] {
  const featureMap: Record<string, { suggested: number; added: number }> = {};

  for (const item of displayData) {
    for (const f of item.totals_by_feature ?? []) {
      if (!featureMap[f.feature]) featureMap[f.feature] = { suggested: 0, added: 0 };
      featureMap[f.feature].suggested += f.loc_suggested_to_add_sum;
      featureMap[f.feature].added += f.loc_added_sum;
    }
  }

  return USER_INITIATED_FEATURES.map(({ key, label }) => ({
    feature: label,
    suggested: featureMap[key]?.suggested ?? 0,
    added: featureMap[key]?.added ?? 0,
  }));
}

export interface AgentCodeChangesByFeatureData {
  feature: string;
  added: number;
  deleted: number;
}

export function getAgentInitiatedCodeChanges(
  displayData: CopilotUsageOutput[]
): AgentCodeChangesByFeatureData[] {
  let totalAdded = 0;
  let totalDeleted = 0;

  for (const item of displayData) {
    for (const f of item.totals_by_feature ?? []) {
      if (AGENT_INITIATED_FEATURE_KEYS.has(f.feature)) {
        totalAdded += f.loc_added_sum;
        totalDeleted += f.loc_deleted_sum;
      }
    }
  }

  return [{ feature: "Agent", added: totalAdded, deleted: totalDeleted }];
}