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
    let totalLinesSuggested = 0;
    let totalLinesAccepted = 0;
    let totalCodeCompletionLinesSuggested = 0;
    let totalCodeCompletionLinesAccepted = 0;
    let totalUserInitiatedChatRequests = 0;
    chatFeatures.forEach((featureData) => {
      if (featureData.feature.includes("chat")) {
        // chat panel and inline chat
        totalChats += featureData.user_initiated_interaction_count;
        totalChatGenerations += featureData.code_generation_activity_count;
        totalAcceptedChats += featureData.code_acceptance_activity_count;
        totalLinesSuggested += featureData.loc_suggested_to_add_sum;
        totalLinesAccepted += featureData.loc_added_sum;
      }
      if (featureData.feature === "code_completion") {
        // code completion
        totalCodeCompletionLinesSuggested += featureData.loc_suggested_to_add_sum;
        totalCodeCompletionLinesAccepted += featureData.loc_added_sum;
        totalLinesSuggested += featureData.loc_suggested_to_add_sum;
        totalLinesAccepted += featureData.loc_added_sum;
      } else {
        // All features except code_completion count as user-initiated chat requests
        totalUserInitiatedChatRequests += featureData.user_initiated_interaction_count;
      }
    });

    const output: CopilotUsageOutput = {
      day: item.day,
      total_active_users: 1,
      total_chat_engaged_users: item.used_chat ? 1 : 0,
      total_cli_engaged_users: item.used_cli ? 1 : 0,
      total_ide_engaged_users: item.totals_by_ide.length > 0 ? 1 : 0,
      total_code_suggestions: item.code_generation_activity_count,
      total_code_acceptances: item.code_acceptance_activity_count,
      total_code_lines_suggested: totalLinesSuggested,
      total_code_lines_accepted: totalLinesAccepted,
      total_chats: totalChats,
      total_accepted_chats: totalAcceptedChats,
      total_chat_generations: totalChatGenerations,
      total_user_initiated_chat_requests: totalUserInitiatedChatRequests,
      time_frame_week: weekIdentifier,
      time_frame_display: weekIdentifier,
    };
    dataUserToUsage.set(item.user_login, [...(dataUserToUsage.get(item.user_login) || []), output]);
  });

  return dataUserToUsage;
};