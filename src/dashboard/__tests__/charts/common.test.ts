import { describe, it, expect } from "vitest";
import {
  computeActiveUserAverage,
  computeAgentContributionRate,
  computeAvgChatRequestsPerActiveUser,
  computeCodeCompletionAcceptanceRate,
  computeCumulativeAcceptanceAverage,
  codeCompletionSuggestionsAndAcceptances,
  formatCompact,
  getActiveUsers,
  getActiveUsersOnDate,
  getAgentInitiatedCodeChanges,
  getDailyLinesAddedDeleted,
  getMostUsedModel,
  getRequestsPerChatMode,
  getTopModels,
  getUserInitiatedCodeChangesByFeature,
  computeTotalLinesAdded,
  computeTotalLinesDeleted,
} from "../../features/dashboard/charts/common";
import { makeFeature, makeModelFeature, makeUsageOutput } from "../fixtures";

// ---------------------------------------------------------------------------
// formatCompact
// ---------------------------------------------------------------------------
describe("formatCompact", () => {
  it("returns plain number for values under 1,000", () => {
    expect(formatCompact(0)).toBe("0");
    expect(formatCompact(999)).toBe("999");
  });

  it("formats thousands with 1 decimal and k suffix", () => {
    expect(formatCompact(1_000)).toBe("1.0k");
    expect(formatCompact(1_500)).toBe("1.5k");
    expect(formatCompact(12_345)).toBe("12.3k");
  });

  it("formats millions with 1 decimal and m suffix", () => {
    expect(formatCompact(1_000_000)).toBe("1.0m");
    expect(formatCompact(2_500_000)).toBe("2.5m");
    expect(formatCompact(1_234_567)).toBe("1.2m");
  });

  it("prefers m over k for values >= 1,000,000", () => {
    expect(formatCompact(1_000_000)).toContain("m");
    expect(formatCompact(1_000_000)).not.toContain("k");
  });
});

// ---------------------------------------------------------------------------
// getActiveUsers
// ---------------------------------------------------------------------------
describe("getActiveUsers", () => {
  it("returns empty array for empty input", () => {
    expect(getActiveUsers([])).toEqual([]);
  });

  it("maps total_active_users and formats timeFrameDisplay", () => {
    const data = [
      makeUsageOutput("2026-05-01", { total_active_users: 42 }),
      makeUsageOutput("2026-05-02", { total_active_users: 7 }),
    ];
    const result = getActiveUsers(data);
    expect(result).toHaveLength(2);
    expect(result[0].totalUsers).toBe(42);
    expect(result[1].totalUsers).toBe(7);
    expect(typeof result[0].timeFrameDisplay).toBe("string");
    expect(result[0].timeFrameDisplay.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// computeActiveUserAverage
// ---------------------------------------------------------------------------
describe("computeActiveUserAverage", () => {
  it("returns 0 for empty data", () => {
    expect(computeActiveUserAverage([])).toBe(0);
  });

  it("computes the average correctly", () => {
    const data = [
      makeUsageOutput("2026-05-01", { total_active_users: 10 }),
      makeUsageOutput("2026-05-02", { total_active_users: 20 }),
      makeUsageOutput("2026-05-03", { total_active_users: 30 }),
    ];
    expect(computeActiveUserAverage(data)).toBe(20);
  });

  it("handles a single entry", () => {
    expect(computeActiveUserAverage([makeUsageOutput("2026-05-01", { total_active_users: 5 })])).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// computeCumulativeAcceptanceAverage
// ---------------------------------------------------------------------------
describe("computeCumulativeAcceptanceAverage", () => {
  it("returns 0 for empty data", () => {
    expect(computeCumulativeAcceptanceAverage([])).toBe(0);
  });

  it("returns 0 when all suggested values are zero and no accepted lines", () => {
    const data = [makeUsageOutput("2026-05-01", { totals_by_feature: [] })];
    expect(computeCumulativeAcceptanceAverage(data)).toBe(0);
  });

  it("calculates correct acceptance rate for normal features", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [
          makeFeature("code_completion", {
            loc_suggested_to_add_sum: 100,
            loc_suggested_to_delete_sum: 50,
            loc_added_sum: 75,
            loc_deleted_sum: 25,
          }),
        ],
      }),
    ];
    // accepted=100, suggested=150 → 66.67%
    expect(computeCumulativeAcceptanceAverage(data)).toBeCloseTo(66.67, 1);
  });

  it("returns 100% when all suggestions are accepted", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [
          makeFeature("code_completion", {
            loc_suggested_to_add_sum: 200,
            loc_suggested_to_delete_sum: 0,
            loc_added_sum: 200,
            loc_deleted_sum: 0,
          }),
        ],
      }),
    ];
    expect(computeCumulativeAcceptanceAverage(data)).toBe(100);
  });

  it("treats no-suggest features (suggested=0, accepted>0) as 100% acceptance", () => {
    // e.g. copilot_cli / agent_edit: loc_suggested always 0
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [
          makeFeature("agent_edit", {
            loc_suggested_to_add_sum: 0,
            loc_suggested_to_delete_sum: 0,
            loc_added_sum: 80,
            loc_deleted_sum: 20,
          }),
        ],
      }),
    ];
    // both totalSuggested and totalAccepted += 100 → 100%
    expect(computeCumulativeAcceptanceAverage(data)).toBe(100);
  });

  it("combines normal and no-suggest features correctly", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [
          // Normal: suggested=200, accepted=100 → contributes 200/100
          makeFeature("code_completion", {
            loc_suggested_to_add_sum: 200,
            loc_added_sum: 100,
          }),
          // No-suggest: accepted=50 → adds 50 to both sides
          makeFeature("copilot_cli", {
            loc_suggested_to_add_sum: 0,
            loc_added_sum: 50,
          }),
        ],
      }),
    ];
    // totalSuggested=250, totalAccepted=150 → 60%
    expect(computeCumulativeAcceptanceAverage(data)).toBe(60);
  });

  it("skips the 'others' feature entirely", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [
          makeFeature("others", {
            loc_suggested_to_add_sum: 1000,
            loc_added_sum: 500,
          }),
          makeFeature("code_completion", {
            loc_suggested_to_add_sum: 100,
            loc_added_sum: 50,
          }),
        ],
      }),
    ];
    // only code_completion counts: 50/100 = 50%
    expect(computeCumulativeAcceptanceAverage(data)).toBe(50);
  });

  it("aggregates across multiple days", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [
          makeFeature("code_completion", { loc_suggested_to_add_sum: 100, loc_added_sum: 50 }),
        ],
      }),
      makeUsageOutput("2026-05-02", {
        totals_by_feature: [
          makeFeature("code_completion", { loc_suggested_to_add_sum: 100, loc_added_sum: 100 }),
        ],
      }),
    ];
    // totalSuggested=200, totalAccepted=150 → 75%
    expect(computeCumulativeAcceptanceAverage(data)).toBe(75);
  });

  it("ignores features with suggested=0 and accepted=0 (no contribution)", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [
          makeFeature("agent_edit", { loc_suggested_to_add_sum: 0, loc_added_sum: 0 }),
          makeFeature("code_completion", { loc_suggested_to_add_sum: 100, loc_added_sum: 80 }),
        ],
      }),
    ];
    expect(computeCumulativeAcceptanceAverage(data)).toBe(80);
  });
});

// ---------------------------------------------------------------------------
// computeAgentContributionRate
// ---------------------------------------------------------------------------
describe("computeAgentContributionRate", () => {
  it("returns 0 for empty data", () => {
    expect(computeAgentContributionRate([])).toBe(0);
  });

  it("returns 0 when total lines changed is zero", () => {
    const data = [makeUsageOutput("2026-05-01", { total_lines_added: 0, total_lines_deleted: 0 })];
    expect(computeAgentContributionRate(data)).toBe(0);
  });

  it("returns 0 when there are no agent_edit features", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        total_lines_added: 100,
        total_lines_deleted: 50,
        totals_by_feature: [
          makeFeature("code_completion", { loc_added_sum: 100, loc_deleted_sum: 50 }),
        ],
      }),
    ];
    expect(computeAgentContributionRate(data)).toBe(0);
  });

  it("calculates agent contribution from agent_edit feature only", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        total_lines_added: 100,
        total_lines_deleted: 50,
        totals_by_feature: [
          makeFeature("agent_edit", { loc_added_sum: 20, loc_deleted_sum: 10 }),
          makeFeature("code_completion", { loc_added_sum: 80, loc_deleted_sum: 40 }),
        ],
      }),
    ];
    // agent=(20+10)=30, total=(100+50)=150 → 20%
    expect(computeAgentContributionRate(data)).toBe(20);
  });

  it("aggregates agent contributions across multiple days", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        total_lines_added: 100,
        total_lines_deleted: 0,
        totals_by_feature: [makeFeature("agent_edit", { loc_added_sum: 25 })],
      }),
      makeUsageOutput("2026-05-02", {
        total_lines_added: 100,
        total_lines_deleted: 0,
        totals_by_feature: [makeFeature("agent_edit", { loc_added_sum: 25 })],
      }),
    ];
    // agent=50, total=200 → 25%
    expect(computeAgentContributionRate(data)).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// getTopModels / getMostUsedModel
// ---------------------------------------------------------------------------
describe("getTopModels", () => {
  it("returns empty array for empty data", () => {
    expect(getTopModels([], 3)).toEqual([]);
  });

  it("returns at most count entries, sorted by interactions descending", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_model_feature: [
          makeModelFeature("gpt-4o", "chat", { user_initiated_interaction_count: 50 }),
          makeModelFeature("claude-3", "chat", { user_initiated_interaction_count: 100 }),
          makeModelFeature("gemini", "chat", { user_initiated_interaction_count: 30 }),
        ],
      }),
    ];
    const top2 = getTopModels(data, 2);
    expect(top2).toHaveLength(2);
    expect(top2[0].model).toBe("claude-3");
    expect(top2[0].interactions).toBe(100);
    expect(top2[1].model).toBe("gpt-4o");
  });

  it("aggregates interactions for the same model across days and features", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_model_feature: [
          makeModelFeature("gpt-4o", "chat", { user_initiated_interaction_count: 40 }),
          makeModelFeature("gpt-4o", "code_completion", { user_initiated_interaction_count: 60 }),
        ],
      }),
      makeUsageOutput("2026-05-02", {
        totals_by_model_feature: [
          makeModelFeature("gpt-4o", "chat", { user_initiated_interaction_count: 20 }),
        ],
      }),
    ];
    const top = getTopModels(data, 1);
    expect(top[0].model).toBe("gpt-4o");
    expect(top[0].interactions).toBe(120);
  });

  it("returns fewer entries than count when data has fewer models", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_model_feature: [
          makeModelFeature("gpt-4o", "chat", { user_initiated_interaction_count: 10 }),
        ],
      }),
    ];
    expect(getTopModels(data, 5)).toHaveLength(1);
  });
});

describe("getMostUsedModel", () => {
  it("returns N/A for empty data", () => {
    expect(getMostUsedModel([])).toBe("N/A");
  });

  it("returns the model with highest interactions", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_model_feature: [
          makeModelFeature("gpt-4o", "chat", { user_initiated_interaction_count: 10 }),
          makeModelFeature("claude-3", "chat", { user_initiated_interaction_count: 99 }),
        ],
      }),
    ];
    expect(getMostUsedModel(data)).toBe("claude-3");
  });
});

// ---------------------------------------------------------------------------
// getUserInitiatedCodeChangesByFeature
// ---------------------------------------------------------------------------
describe("getUserInitiatedCodeChangesByFeature", () => {
  it("returns all 5 user-initiated features even with no data", () => {
    const result = getUserInitiatedCodeChangesByFeature([]);
    expect(result).toHaveLength(5);
    const labels = result.map((r) => r.feature);
    expect(labels).toContain("Completions");
    expect(labels).toContain("Ask");
    expect(labels).toContain("Inline");
    expect(labels).toContain("Agent");
    expect(labels).toContain("Custom");
  });

  it("maps feature keys to display labels with correct values", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [
          makeFeature("code_completion", { loc_suggested_to_add_sum: 200, loc_added_sum: 150 }),
          makeFeature("chat_panel_ask_mode", { loc_suggested_to_add_sum: 50, loc_added_sum: 30 }),
        ],
      }),
    ];
    const result = getUserInitiatedCodeChangesByFeature(data);
    const completions = result.find((r) => r.feature === "Completions")!;
    expect(completions.suggested).toBe(200);
    expect(completions.added).toBe(150);
    const ask = result.find((r) => r.feature === "Ask")!;
    expect(ask.suggested).toBe(50);
    expect(ask.added).toBe(30);
  });

  it("aggregates values across multiple days", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [makeFeature("code_completion", { loc_added_sum: 100 })],
      }),
      makeUsageOutput("2026-05-02", {
        totals_by_feature: [makeFeature("code_completion", { loc_added_sum: 200 })],
      }),
    ];
    const completions = getUserInitiatedCodeChangesByFeature(data).find(
      (r) => r.feature === "Completions"
    )!;
    expect(completions.added).toBe(300);
  });

  it("ignores unrecognised features (e.g. agent_edit, others)", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [
          makeFeature("agent_edit", { loc_added_sum: 999 }),
          makeFeature("others", { loc_added_sum: 999 }),
        ],
      }),
    ];
    const result = getUserInitiatedCodeChangesByFeature(data);
    result.forEach((r) => expect(r.added).toBe(0));
  });
});

// ---------------------------------------------------------------------------
// getAgentInitiatedCodeChanges
// ---------------------------------------------------------------------------
describe("getAgentInitiatedCodeChanges", () => {
  it("returns a single Agent entry with zeros for empty data", () => {
    const result = getAgentInitiatedCodeChanges([]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ feature: "Agent", added: 0, deleted: 0 });
  });

  it("sums only agent_edit feature lines", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [
          makeFeature("agent_edit", { loc_added_sum: 60, loc_deleted_sum: 40 }),
          makeFeature("code_completion", { loc_added_sum: 100, loc_deleted_sum: 50 }),
        ],
      }),
    ];
    const result = getAgentInitiatedCodeChanges(data);
    expect(result[0].added).toBe(60);
    expect(result[0].deleted).toBe(40);
  });

  it("aggregates across multiple days", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        totals_by_feature: [makeFeature("agent_edit", { loc_added_sum: 30, loc_deleted_sum: 10 })],
      }),
      makeUsageOutput("2026-05-02", {
        totals_by_feature: [makeFeature("agent_edit", { loc_added_sum: 20, loc_deleted_sum: 5 })],
      }),
    ];
    const result = getAgentInitiatedCodeChanges(data);
    expect(result[0].added).toBe(50);
    expect(result[0].deleted).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// computeAvgChatRequestsPerActiveUser
// ---------------------------------------------------------------------------
describe("computeAvgChatRequestsPerActiveUser", () => {
  it("returns 0 avg when active users is 0", () => {
    const data = [
      makeUsageOutput("2026-05-01", { total_active_users: 0, total_user_initiated_chat_requests: 10 }),
    ];
    expect(computeAvgChatRequestsPerActiveUser(data)[0].avgChatRequests).toBe(0);
  });

  it("calculates correct average", () => {
    const data = [
      makeUsageOutput("2026-05-01", { total_active_users: 4, total_user_initiated_chat_requests: 10 }),
    ];
    expect(computeAvgChatRequestsPerActiveUser(data)[0].avgChatRequests).toBe(2.5);
  });

  it("defaults missing chat requests to 0", () => {
    const data = [makeUsageOutput("2026-05-01", { total_active_users: 5 })];
    expect(computeAvgChatRequestsPerActiveUser(data)[0].avgChatRequests).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getRequestsPerChatMode
// ---------------------------------------------------------------------------
describe("getRequestsPerChatMode", () => {
  it("maps all chat mode fields, defaulting to 0", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        chat_requests_ask: 5,
        chat_requests_agent: 10,
      }),
    ];
    const result = getRequestsPerChatMode(data);
    expect(result[0].ask).toBe(5);
    expect(result[0].agent).toBe(10);
    expect(result[0].inline).toBe(0);
    expect(result[0].edit).toBe(0);
    expect(result[0].custom).toBe(0);
    expect(result[0].plan).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeCodeCompletionAcceptanceRate
// ---------------------------------------------------------------------------
describe("computeCodeCompletionAcceptanceRate", () => {
  it("returns 0 when there are no suggestions", () => {
    const data = [makeUsageOutput("2026-05-01", { code_completion_suggestions: 0, code_completion_acceptances: 5 })];
    expect(computeCodeCompletionAcceptanceRate(data)[0].acceptanceRate).toBe(0);
  });

  it("calculates acceptance rate rounded to 1 decimal", () => {
    const data = [makeUsageOutput("2026-05-01", { code_completion_suggestions: 3, code_completion_acceptances: 1 })];
    // 1/3 * 100 = 33.33... → rounds to 33.3
    expect(computeCodeCompletionAcceptanceRate(data)[0].acceptanceRate).toBe(33.3);
  });

  it("returns 100 for full acceptance", () => {
    const data = [makeUsageOutput("2026-05-01", { code_completion_suggestions: 50, code_completion_acceptances: 50 })];
    expect(computeCodeCompletionAcceptanceRate(data)[0].acceptanceRate).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// codeCompletionSuggestionsAndAcceptances
// ---------------------------------------------------------------------------
describe("codeCompletionSuggestionsAndAcceptances", () => {
  it("maps fields correctly and defaults null to 0", () => {
    const data = [
      makeUsageOutput("2026-05-01", {
        code_completion_suggestions: 80,
        code_completion_acceptances: 40,
      }),
      makeUsageOutput("2026-05-02"), // no suggestions/acceptances
    ];
    const result = codeCompletionSuggestionsAndAcceptances(data);
    expect(result[0].suggestedCompletions).toBe(80);
    expect(result[0].acceptedCompletions).toBe(40);
    expect(result[1].suggestedCompletions).toBe(0);
    expect(result[1].acceptedCompletions).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeTotalLinesAdded / computeTotalLinesDeleted
// ---------------------------------------------------------------------------
describe("computeTotalLinesAdded", () => {
  it("returns 0 for empty data", () => {
    expect(computeTotalLinesAdded([])).toBe(0);
  });

  it("sums total_lines_added across all days", () => {
    const data = [
      makeUsageOutput("2026-05-01", { total_lines_added: 100 }),
      makeUsageOutput("2026-05-02", { total_lines_added: 250 }),
    ];
    expect(computeTotalLinesAdded(data)).toBe(350);
  });
});

describe("computeTotalLinesDeleted", () => {
  it("returns 0 for empty data", () => {
    expect(computeTotalLinesDeleted([])).toBe(0);
  });

  it("sums total_lines_deleted across all days", () => {
    const data = [
      makeUsageOutput("2026-05-01", { total_lines_deleted: 30 }),
      makeUsageOutput("2026-05-02", { total_lines_deleted: 70 }),
    ];
    expect(computeTotalLinesDeleted(data)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// getDailyLinesAddedDeleted
// ---------------------------------------------------------------------------
describe("getDailyLinesAddedDeleted", () => {
  it("maps added/deleted per day", () => {
    const data = [
      makeUsageOutput("2026-05-01", { total_lines_added: 50, total_lines_deleted: 20 }),
    ];
    const result = getDailyLinesAddedDeleted(data);
    expect(result[0].added).toBe(50);
    expect(result[0].deleted).toBe(20);
    expect(typeof result[0].timeFrameDisplay).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// getActiveUsersOnDate
// ---------------------------------------------------------------------------
describe("getActiveUsersOnDate", () => {
  it("returns 0 when date is not found", () => {
    expect(getActiveUsersOnDate([], "2026-05-01")).toBe(0);
  });

  it("returns total_active_users for the matched date", () => {
    const data = [
      makeUsageOutput("2026-05-01", { total_active_users: 33 }),
      makeUsageOutput("2026-05-02", { total_active_users: 55 }),
    ];
    expect(getActiveUsersOnDate(data, "2026-05-01")).toBe(33);
    expect(getActiveUsersOnDate(data, "2026-05-02")).toBe(55);
    expect(getActiveUsersOnDate(data, "2026-05-03")).toBe(0);
  });
});
