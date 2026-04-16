import { featuresEnvConfig } from "@/services/env-service";
import { format, startOfWeek, parse, isValid } from "date-fns";
import { CopilotUsageOutput, CopilotMetricsReportData } from "@/features/common/models";


export const getFeatures = () => {
  const features = featuresEnvConfig();
  if (features.status !== "OK") {
    return {
      dashboard: true,
      premiumRequests: true,
      seats: true,
    }
  }
  return features.response;
}

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const parseDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : null;
};

export const stringIsNullOrEmpty = (str: string | null | undefined) => {
  return str === null || str === undefined || str === "";
};

export const getNextUrlFromLinkHeader = (linkHeader: string | null): string | null => {
  if (!linkHeader) return null;

  const links = linkHeader.split(',');
  for (const link of links) {
    const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match && match[2] === 'next') {
      return match[1];
    }
  }
  return null;
}

export const transformCopilotMetricsReportData = (
  data: CopilotMetricsReportData[]
): Map<string, CopilotUsageOutput[]> => {
  // map user to their daily usage data

  if (!data || !Array.isArray(data) || data.length === 0) {
    return new Map();
  }

  const sortedData = [...data].sort(
    (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()
  );

  const dataUserToUsage: Map<string, CopilotUsageOutput[]> = new Map();

  sortedData.forEach((item) => {
    if (!item.day) {
      return;
    }
    const date = new Date(item.day);
    if (isNaN(date.getTime())) {
      return;
    }
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekIdentifier = format(weekStart, "MMM dd");

    const chatFeatures = item.totals_by_feature || [];
    let totalChats = 0;
    let totalChatGenerations = 0;
    let totalAcceptedChats = 0;
    let totalCodeCompletionLinesSuggested = 0;
    let totalCodeCompletionLinesAccepted = 0;
    let totalCodeCompletionSuggested = 0;
    let totalCodeCompletionAccepted = 0;
    chatFeatures.forEach((featureData) => {
      if (featureData.feature.includes("chat")) {
        totalChats += featureData.user_initiated_interaction_count;
        totalChatGenerations += featureData.code_generation_activity_count;
        totalAcceptedChats += featureData.code_acceptance_activity_count;
      }
      if (featureData.feature === "code_completion") {
        totalCodeCompletionSuggested += featureData.code_generation_activity_count;
        totalCodeCompletionAccepted += featureData.code_acceptance_activity_count;
        // Scope lines to code_completion only so acceptanceLinesRate
        // is comparable to acceptanceRate (both code-completion-scoped)
        totalCodeCompletionLinesSuggested += featureData.loc_suggested_to_add_sum;
        totalCodeCompletionLinesAccepted += featureData.loc_added_sum;
      }
    });

    const output: CopilotUsageOutput = {
      day: item.day,
      used_chat: item.used_chat,
      used_cli: item.used_cli,
      total_active_users: 1,
      total_ide_engaged_users: item.totals_by_ide.length > 0 ? 1 : 0,
      total_code_suggestions: totalCodeCompletionSuggested,
      total_code_acceptances: totalCodeCompletionAccepted,
      total_code_lines_suggested: totalCodeCompletionLinesSuggested,
      total_code_lines_accepted: totalCodeCompletionLinesAccepted,
      total_chats: totalChats,
      total_accepted_chats: totalAcceptedChats,
      total_chat_generations: totalChatGenerations,
      time_frame_week: weekIdentifier,
      time_frame_display: weekIdentifier,
    };
    dataUserToUsage.set(item.user_login, [...(dataUserToUsage.get(item.user_login) || []), output]);
  });

  return dataUserToUsage;
};