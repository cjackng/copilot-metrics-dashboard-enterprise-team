/**
 * Shared test fixtures and factory functions for building mock data objects.
 */
import type {
  CopilotUsageOutput,
  CopilotMetricsReportData,
  TotalsByFeature,
  TotalsByModelFeature,
} from "../features/common/models";

export function makeFeature(
  feature: string,
  overrides: Partial<TotalsByFeature> = {}
): TotalsByFeature {
  return {
    feature,
    user_initiated_interaction_count: 0,
    code_generation_activity_count: 0,
    code_acceptance_activity_count: 0,
    loc_suggested_to_add_sum: 0,
    loc_suggested_to_delete_sum: 0,
    loc_added_sum: 0,
    loc_deleted_sum: 0,
    ...overrides,
  };
}

export function makeModelFeature(
  model: string,
  feature: string,
  overrides: Partial<TotalsByModelFeature> = {}
): TotalsByModelFeature {
  return {
    model,
    feature,
    user_initiated_interaction_count: 0,
    code_generation_activity_count: 0,
    code_acceptance_activity_count: 0,
    loc_suggested_to_add_sum: 0,
    loc_suggested_to_delete_sum: 0,
    loc_added_sum: 0,
    loc_deleted_sum: 0,
    ...overrides,
  };
}

export function makeUsageOutput(
  day: string,
  overrides: Partial<CopilotUsageOutput> = {}
): CopilotUsageOutput {
  return {
    day,
    total_active_users: 1,
    total_ide_engaged_users: 0,
    total_chat_engaged_users: 0,
    total_cli_engaged_users: 0,
    total_code_suggestions: 0,
    total_code_acceptances: 0,
    total_code_lines_suggested: 0,
    total_code_lines_accepted: 0,
    total_chats: 0,
    total_accepted_chats: 0,
    total_lines_added: 0,
    total_lines_deleted: 0,
    totals_by_feature: [],
    totals_by_model_feature: [],
    ...overrides,
  };
}

export function makeReportData(
  userLogin: string,
  day: string,
  overrides: Partial<CopilotMetricsReportData> = {}
): CopilotMetricsReportData {
  return {
    report_start_day: day,
    report_end_day: day,
    day,
    enterprise_id: "ent-1",
    user_id: "user-id-1",
    user_login: userLogin,
    user_initiated_interaction_count: 0,
    code_generation_activity_count: 0,
    code_acceptance_activity_count: 0,
    totals_by_ide: [],
    totals_by_feature: [],
    totals_by_language_feature: [],
    totals_by_language_model: [],
    totals_by_model_feature: [],
    used_agent: false,
    used_chat: false,
    loc_suggested_to_add_sum: 0,
    loc_suggested_to_delete_sum: 0,
    loc_added_sum: 0,
    loc_deleted_sum: 0,
    used_cli: false,
    used_copilot_coding_agent: false,
    ...overrides,
  };
}
