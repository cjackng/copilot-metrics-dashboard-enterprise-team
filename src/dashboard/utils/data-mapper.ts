import { CopilotUsageOutput } from "@/features/common/models";

export const groupByTimeFrame = (
  groupedByTimeFrame: Record<string, CopilotUsageOutput[]>
) => {
  const updatedResponse: CopilotUsageOutput[] = [];

  Object.keys(groupedByTimeFrame).forEach((week) => {
    const first = groupedByTimeFrame[week][0];
    const aggregatedData: CopilotUsageOutput = {
      day: first.day,
      time_frame_week: first.time_frame_week,
      time_frame_display: week,
      total_active_users: 0,
      total_ide_engaged_users: 0,
      total_chat_engaged_users: 0,
      total_cli_engaged_users: 0,
      total_code_suggestions: 0,
      total_code_acceptances: 0,
      total_code_lines_suggested: 0,
      total_code_lines_accepted: 0,
      total_chat_generations: 0,
      total_chats: 0,
      total_accepted_chats: 0,
      total_user_initiated_chat_requests: 0,
    };

    groupedByTimeFrame[week].forEach((item) => {
      aggregatedData.total_code_suggestions += item.total_code_suggestions;
      aggregatedData.total_code_acceptances += item.total_code_acceptances;
      aggregatedData.total_code_lines_suggested += item.total_code_lines_suggested;
      aggregatedData.total_code_lines_accepted += item.total_code_lines_accepted;
      aggregatedData.total_chats += item.total_chats;
      aggregatedData.total_accepted_chats += item.total_accepted_chats;
      aggregatedData.total_chat_generations! += item.total_chat_generations ?? 0;
      aggregatedData.total_user_initiated_chat_requests! += item.total_user_initiated_chat_requests ?? 0;
      // Per-user weekly aggregate: active/ide_engaged/chat_engaged/cli_engaged is binary (0 or 1)
      aggregatedData.total_active_users = Math.min(1, aggregatedData.total_active_users + item.total_active_users);
      aggregatedData.total_ide_engaged_users = Math.min(1, aggregatedData.total_ide_engaged_users + item.total_ide_engaged_users);
      aggregatedData.total_chat_engaged_users = Math.min(1, aggregatedData.total_chat_engaged_users + item.total_chat_engaged_users);
      aggregatedData.total_cli_engaged_users = Math.min(1, aggregatedData.total_cli_engaged_users + item.total_cli_engaged_users);
    });

    updatedResponse.push(aggregatedData);
  });

  return updatedResponse;
};
