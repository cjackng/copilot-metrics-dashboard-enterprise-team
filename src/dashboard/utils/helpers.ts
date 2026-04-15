import { featuresEnvConfig } from "@/services/env-service";
import { format, startOfWeek, parse, isValid } from "date-fns";
import { CopilotMetrics, CopilotUsageOutput, CopilotMetricsReportData } from "@/features/common/models";

export const applyTimeFrameLabel = (
  data: CopilotMetrics[]
): CopilotUsageOutput[] => {
  // Sort data by 'day'
  const sortedData = data.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const dataWithTimeFrame: CopilotUsageOutput[] = [];

  sortedData.forEach((item) => {
    // Convert 'day' to a Date object and find the start of its week
    const date = new Date(item.date);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });

    // Create a unique week identifier
    const weekIdentifier = format(weekStart, "MMM dd");
    const monthIdentifier = format(date, "MMM yy");

    const output: CopilotUsageOutput = {
      ...item,
      total_active_users: item.total_active_users,
      total_ide_engaged_users: item.copilot_ide_code_completions?.total_engaged_users,
      total_code_suggestions: (item.copilot_ide_code_completions?.editors|| []).reduce((acc, editor) => acc + editor.models.reduce((modelAcc, model) => modelAcc + model.languages!.reduce((langAcc, lang) => langAcc + (lang.total_code_suggestions || 0), 0), 0), 0),
      total_code_acceptances: (item.copilot_ide_code_completions?.editors|| []).reduce((acc, editor) => acc + editor.models.reduce((modelAcc, model) => modelAcc + model.languages!.reduce((langAcc, lang) => langAcc + (lang.total_code_acceptances || 0), 0), 0), 0),
      total_code_lines_suggested: (item.copilot_ide_code_completions?.editors|| []).reduce((acc, editor) => acc + editor.models.reduce((modelAcc, model) => modelAcc + model.languages!.reduce((langAcc, lang) => langAcc + (lang.total_code_lines_suggested || 0), 0), 0), 0),
      total_code_lines_accepted: (item.copilot_ide_code_completions?.editors|| []).reduce((acc, editor) => acc + editor.models.reduce((modelAcc, model) => modelAcc + model.languages!.reduce((langAcc, lang) => langAcc + (lang.total_code_lines_accepted || 0), 0), 0), 0),
      total_chats:  (item.copilot_ide_chat?.editors || []).reduce((acc, editor) => acc + (editor.models.reduce((modelAcc, model) => modelAcc + (model.total_chats || 0), 0)), 0),
      total_accepted_chats:  (item.copilot_ide_chat?.editors || []).reduce((acc, editor) => acc + (editor.models.reduce((modelAcc, model) => modelAcc + (model.total_chat_insertion_events || 0) + (model.total_chat_copy_events || 0), 0)), 0),
      day: item.date,

      time_frame_week: weekIdentifier,
      time_frame_display: weekIdentifier,
    };
    dataWithTimeFrame.push(output);
  });

  return dataWithTimeFrame;
};

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
): CopilotUsageOutput[] => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const sortedData = [...data].sort(
    (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()
  );

  const dataWithTimeFrame: CopilotUsageOutput[] = [];

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
    let totalCodeCompletionSuggested = 0;
    let totalCodeCompletionAccepted = 0;
    chatFeatures.forEach((featureData) => {
      if (featureData.feature !== "agent_edit") {
        totalLinesSuggested += featureData.loc_suggested_to_add_sum;
        totalLinesAccepted += featureData.loc_added_sum;
      }
      if (featureData.feature.includes("chat")) {
        totalChats += featureData.user_initiated_interaction_count;
        totalChatGenerations += featureData.code_generation_activity_count;
        totalAcceptedChats += featureData.code_acceptance_activity_count;
      }
      if (featureData.feature === "code_completion") {
        totalCodeCompletionSuggested += featureData.code_generation_activity_count;
        totalCodeCompletionAccepted += featureData.code_acceptance_activity_count;
      }
    });

    const output: CopilotUsageOutput = {
      day: item.day,
      total_active_users: item.daily_active_users,
      total_ide_engaged_users: item.daily_active_users - (item.daily_active_cli_users ?? 0),
      total_code_suggestions: totalCodeCompletionSuggested,
      total_code_acceptances: totalCodeCompletionAccepted,
      total_code_lines_suggested: totalLinesSuggested,
      total_code_lines_accepted: totalLinesAccepted,
      total_chats: totalChats,
      total_accepted_chats: totalAcceptedChats,
      total_chat_generations: totalChatGenerations,
      time_frame_week: weekIdentifier,
      time_frame_display: weekIdentifier,
    };
    dataWithTimeFrame.push(output);
  });

  return dataWithTimeFrame;
};