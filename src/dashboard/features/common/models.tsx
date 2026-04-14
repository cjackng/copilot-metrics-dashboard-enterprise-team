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

export interface CopilotUsage {
    total_active_users: number;
    total_engaged_users: number;
    total_ide_engaged_users: number;
    total_code_suggestions: number;
    total_code_acceptances: number;
    total_code_lines_suggested: number;
    total_code_lines_accepted: number;
    total_chat_engaged_users: number;
    total_chats: number;
    total_accepted_chats: number;
    day: string;
  }

  export interface CopilotUsageOutput extends CopilotUsage {
    time_frame_week: string;
    time_frame_display: string;
  }

  export interface Languages {
    name: string;
    total_engaged_users: number;
  }

  export interface LanguageMetrics {
    name: string;
    total_engaged_users: number;
    total_code_suggestions?: number;
    total_code_acceptances?: number;
    total_code_lines_suggested?: number;
    total_code_lines_accepted?: number;
  }
  
  export interface ModelMetrics {
    name: string;
    is_custom_model: boolean;
    custom_model_training_date: string | null;
    total_engaged_users: number;
    languages?: LanguageMetrics[];
    total_chats?: number;
    total_chat_insertion_events?: number;
    total_chat_copy_events?: number;
    total_pr_summaries_created?: number;
  }
  
  export interface EditorMetrics {
    name: string;
    total_engaged_users: number;
    models: ModelMetrics[];
  }
  
  export interface RepositoryMetrics {
    name: string;
    total_engaged_users: number;
    models: ModelMetrics[];
  }
  
  export interface CopilotIDEMetrics {
    total_engaged_users: number;
    languages: Languages[];
    editors: EditorMetrics[];
  }
  
  export interface CopilotIDEChatMetrics {
    total_engaged_users: number;
    editors: EditorMetrics[];
  }
  
  export interface CopilotDotcomChatMetrics {
    total_engaged_users: number;
    models: ModelMetrics[];
  }
  
  export interface CopilotDotcomPullRequestsMetrics {
    total_engaged_users: number;
    repositories: RepositoryMetrics[];
  }
  
  export interface CopilotMetrics {
    date: string;
    total_active_users: number;
    total_engaged_users: number;
    copilot_ide_code_completions: CopilotIDEMetrics;
    copilot_ide_chat: CopilotIDEChatMetrics;
    copilot_dotcom_chat: CopilotDotcomChatMetrics;
    copilot_dotcom_pull_requests: CopilotDotcomPullRequestsMetrics;
  }

export interface CopilotMetricsReportResponse {
  download_links: string[];
  report_start_day: string;
  report_end_day: string;
}

export interface CopilotMetricsReportWrapper {
  report_start_day: string;
  report_end_day: string;
  enterprise_id: string;
  created_at: string;
  day_totals: CopilotMetricsReportData[];
}

  export interface CopilotMetricsReportData {
    day: string;
    enterprise_id: string;
    daily_active_users: number;
    daily_active_cli_users: number;
    weekly_active_users: number;
    monthly_active_users: number;
    monthly_active_chat_users: number;
    monthly_active_agent_users: number;
    user_initiated_interaction_count: number;
    code_generation_activity_count: number;
    code_acceptance_activity_count: number;
    totals_by_ide: TotalsByIde[];
    totals_by_feature: TotalsByFeature[];
    totals_by_language_feature: TotalsByLanguageFeature[];
    totals_by_language_model: TotalsByLanguageModel[];
    totals_by_model_feature: TotalsByModelFeature[];
    loc_suggested_to_add_sum: number;
    loc_suggested_to_delete_sum: number;
    loc_added_sum: number;
    loc_deleted_sum: number;
    pull_requests: PullRequests;
    totals_by_cli: TotalsByCli;
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

  export interface PullRequests {
    total_reviewed: number;
    total_created: number;
    total_created_by_copilot: number;
    total_reviewed_by_copilot: number;
    total_merged: number;
    total_suggestions: number;
    total_applied_suggestions: number;
    total_merged_created_by_copilot: number;
    total_copilot_suggestions: number;
    total_copilot_applied_suggestions: number;
  }

  export interface TotalsByCli {
    session_count: number;
    request_count: number;
    token_usage: TokenUsage;
    prompt_count: number;
  }

  export interface TokenUsage {
    output_tokens_sum: number;
    prompt_tokens_sum: number;
    avg_tokens_per_request: number;
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


export interface UserUsageData {
  user: string;
  userDisplayName: string;
  totalRequestQuantity: number;
  totalRequestQuota: number | null;
  team: string[];
}