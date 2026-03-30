import { CopilotUsageOutput } from "@/features/common/models";

export const groupByTimeFrame = (
  groupedByTimeFrame: Record<string, CopilotUsageOutput[]>
) => {
  const updatedResponse: CopilotUsageOutput[] = [];

  Object.keys(groupedByTimeFrame).forEach((week) => {
    const aggregatedData: CopilotUsageOutput = {
      total_active_users: 0,
      total_engaged_users: 0,
      total_ide_engaged_users: 0,
      total_code_suggestions: 0,
      total_code_acceptances: 0,
      total_code_lines_suggested: 0,
      total_code_lines_accepted: 0,
      total_chat_engaged_users: 0,
      total_chats: 0,
      total_accepted_chats: 0,
      day: "", // Decide how to handle this
      time_frame_month: "",
      time_frame_week: "",
      time_frame_display: week,
    };

    const timeFrameLength = groupedByTimeFrame[week].length;

    groupedByTimeFrame[week].forEach((item, index) => {
      aggregatedData.total_active_users += item.total_active_users;
      aggregatedData.total_engaged_users += item.total_engaged_users;
      aggregatedData.total_ide_engaged_users += item.total_ide_engaged_users;
      aggregatedData.total_code_suggestions += item.total_code_suggestions;
      aggregatedData.total_code_acceptances += item.total_code_acceptances;
      aggregatedData.total_code_lines_suggested += item.total_code_lines_suggested;
      aggregatedData.total_code_lines_accepted += item.total_code_lines_accepted;
      aggregatedData.total_chat_engaged_users += item.total_chat_engaged_users;
      aggregatedData.total_chats += item.total_chats;
      aggregatedData.total_accepted_chats += item.total_accepted_chats;

    });

    const average = (value: number) => Math.ceil(value / timeFrameLength);

    aggregatedData.total_active_users = average(
      aggregatedData.total_active_users
    );

    aggregatedData.total_engaged_users = average(
      aggregatedData.total_engaged_users
    );

    aggregatedData.total_chat_engaged_users = average(
      aggregatedData.total_chat_engaged_users
    );

    updatedResponse.push(aggregatedData);
  });

  return updatedResponse;
};
