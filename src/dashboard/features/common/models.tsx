export interface GitHubUser {
    id: number;
    login: string;
    name: string | null;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}

export interface GitHubTeam {
    id: number;
    node_id: string;
    url: string;
    html_url: string;
    name: string;
    slug: string;
    description: string;
    privacy: string;
    notification_setting: string;
    permission: string;
    members_url: string;
    repositories_url: string;
    parent: string | null;
}

export interface GitHubOrganization {
    login: string;
    id: number;
    node_id: string;
    url: string;
    repos_url: string;
    events_url: string;
    hooks_url: string;
    issues_url: string;
    members_url: string;
    public_members_url: string;
    avatar_url: string;
    description: string | null;
}

export interface SeatAssignment {
    created_at: Date;
    updated_at: Date;
    pending_cancellation_date: Date | null;
    last_activity_at: Date;
    last_activity_editor: string;
    plan_type: string;
    assignee: GitHubUser;
    assigning_team: GitHubTeam;
    organization: GitHubOrganization;
}

export interface CopilotSeatsData {
    id: string;
    date: string;
    total_seats: number;
    total_active_seats: number;
    seats: SeatAssignment[];
    enterprise: string | null;
    organization: string | null;
    page: number;
    has_next_page: boolean;
    last_update: string | null;
}

export interface CopilotUsageOutputResponse {
  report_start_day: string;
  report_end_day: string;
  copilotUsages: Map<string, CopilotUsageOutput[]>;
}

export interface CopilotUsageOutput {
  total_active_users: number;
  total_ide_engaged_users: number;
  total_chat_engaged_users: number;
  total_cli_engaged_users: number;
  total_chat_generations?: number;
  /** Sum of code_generation_activity_count and code_acceptance_activity_count */
  total_code_suggestions: number;
  total_code_acceptances: number;
  /** Sum of loc_added_sum and loc_suggested_to_add_sum for chat features and code completion */
  total_code_lines_suggested: number;
  total_code_lines_accepted: number;
  /** Sum of user_initiated_interaction_count for all features except code_completion. */
  total_user_initiated_chat_requests?: number;
  /** User-initiated requests broken down by chat mode. */
  chat_requests_ask?: number;
  chat_requests_inline?: number;
  chat_requests_edit?: number;
  chat_requests_agent?: number;
  chat_requests_custom?: number;
  chat_requests_plan?: number;
  /** Code completion (inline suggestion) activity counts, scoped to the code_completion feature. */
  code_completion_suggestions?: number;
  code_completion_acceptances?: number;
  /** Lines of code suggested/accepted, scoped to the code_completion feature only. */
  code_completion_lines_suggested?: number;
  code_completion_lines_accepted?: number;
  total_chats: number;
  total_accepted_chats: number;
  day: string;
  /** Total lines of code added across all Copilot features (top-level loc_added_sum). */
  total_lines_added: number;
  /** Total lines of code deleted across all Copilot features (top-level loc_deleted_sum). */
  total_lines_deleted: number;
}

export interface CopilotMetricsReportResponse {
  download_links: string[];
  report_start_day: string;
  report_end_day: string;
}

export interface CopilotMetricsDayReportResponse {
  download_links: string[];
  report_day: string;
}

export interface CopilotMetricsReportData {
  report_start_day: string;
  report_end_day: string;
  day: string;
  enterprise_id: string;
  user_id: string;
  user_login: string;
  user_initiated_interaction_count: number;
  code_generation_activity_count: number;
  code_acceptance_activity_count: number;
  totals_by_ide: TotalsByIde[];
  totals_by_feature: TotalsByFeature[];
  totals_by_language_feature: TotalsByLanguageFeature[];
  totals_by_language_model: TotalsByLanguageModel[];
  totals_by_model_feature: TotalsByModelFeature[];
  used_agent: boolean;
  used_chat: boolean;
  loc_suggested_to_add_sum: number;
  loc_suggested_to_delete_sum: number;
  loc_added_sum: number;
  loc_deleted_sum: number;
  used_cli: boolean;
  used_copilot_coding_agent: boolean;
}

  export interface TotalsByIde {
    ide: string;
    user_initiated_interaction_count: number;
    code_generation_activity_count: number;
    code_acceptance_activity_count: number;
    loc_suggested_to_add_sum: number;
    loc_suggested_to_delete_sum: number;
    loc_added_sum: number;
    loc_deleted_sum: number;
  }

  export interface TotalsByFeature {
    feature: string;
    user_initiated_interaction_count: number;
    code_generation_activity_count: number;
    code_acceptance_activity_count: number;
    loc_suggested_to_add_sum: number;
    loc_suggested_to_delete_sum: number;
    loc_added_sum: number;
    loc_deleted_sum: number;
  }

  export interface TotalsByLanguageFeature {
    language: string;
    feature: string;
    code_generation_activity_count: number;
    code_acceptance_activity_count: number;
    loc_suggested_to_add_sum: number;
    loc_suggested_to_delete_sum: number;
    loc_added_sum: number;
    loc_deleted_sum: number;
  }

  export interface TotalsByLanguageModel {
    language: string;
    model: string;
    code_generation_activity_count: number;
    code_acceptance_activity_count: number;
    loc_suggested_to_add_sum: number;
    loc_suggested_to_delete_sum: number;
    loc_added_sum: number;
    loc_deleted_sum: number;
  }

  export interface TotalsByModelFeature {
    model: string;
    feature: string;
    user_initiated_interaction_count: number;
    code_generation_activity_count: number;
    code_acceptance_activity_count: number;
    loc_suggested_to_add_sum: number;
    loc_suggested_to_delete_sum: number;
    loc_added_sum: number;
    loc_deleted_sum: number;
  }

export interface PremiumRequestUsage {
  date: string;                      // ISO date string, e.g. "2026-03-31"
  username: string;
  product: string;
  sku: string;
  model: string;
  quantity: number;
  unit_type: string;
  applied_cost_per_quantity: number;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  exceeds_quota: boolean;
  total_monthly_quota: number;
  organization?: string;
  cost_center_name?: string;
  team?: string; 
  display_username?: string;
};

export interface EnterpriseTeam {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  group_id: number | null;
  organization_selection_type: string | null;
}


export interface UserUsageData {
  user: string;
  userDisplayName: string;
  totalRequestQuantity: number;
  totalRequestQuota: number | null;
  team: string[];
}