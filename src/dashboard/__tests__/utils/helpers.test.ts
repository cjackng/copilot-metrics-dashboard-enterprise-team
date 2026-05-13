import { describe, it, expect } from "vitest";
import {
  formatDate,
  parseDate,
  stringIsNullOrEmpty,
  transformCopilotMetricsReportData,
} from "../../utils/helpers";
import { makeFeature, makeReportData } from "../fixtures";

// ---------------------------------------------------------------------------
// stringIsNullOrEmpty
// ---------------------------------------------------------------------------
describe("stringIsNullOrEmpty", () => {
  it("returns true for null", () => expect(stringIsNullOrEmpty(null)).toBe(true));
  it("returns true for undefined", () => expect(stringIsNullOrEmpty(undefined)).toBe(true));
  it("returns true for empty string", () => expect(stringIsNullOrEmpty("")).toBe(true));
  it("returns false for non-empty string", () => expect(stringIsNullOrEmpty("hello")).toBe(false));
  it("returns false for whitespace string", () => expect(stringIsNullOrEmpty("  ")).toBe(false));
});

// ---------------------------------------------------------------------------
// parseDate
// ---------------------------------------------------------------------------
describe("parseDate", () => {
  it("returns null for null input", () => {
    expect(parseDate(null)).toBeNull();
  });

  it("returns a valid Date for a well-formed date string", () => {
    const result = parseDate("2026-05-13");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(4); // May is month 4 (0-indexed)
    expect(result!.getDate()).toBe(13);
  });

  it("returns null for an invalid date string", () => {
    expect(parseDate("not-a-date")).toBeNull();
    expect(parseDate("2026-99-99")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe("formatDate", () => {
  it("returns a non-empty string for a valid date", () => {
    const result = formatDate("2026-05-15");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the numeric day in the output", () => {
    // Use mid-month date to avoid UTC/local timezone off-by-one edge cases
    const result = formatDate("2026-05-15");
    expect(result).toMatch(/15/);
  });

  it("includes a month abbreviation in the output", () => {
    const result = formatDate("2026-05-15");
    // en-US short month: "May"
    expect(result).toMatch(/May/i);
  });
});

// ---------------------------------------------------------------------------
// transformCopilotMetricsReportData
// ---------------------------------------------------------------------------
describe("transformCopilotMetricsReportData", () => {
  it("returns an empty Map for empty input", () => {
    const result = transformCopilotMetricsReportData([]);
    expect(result.size).toBe(0);
  });

  it("returns an empty Map for null/undefined input", () => {
    // @ts-expect-error testing invalid input
    expect(transformCopilotMetricsReportData(null).size).toBe(0);
  });

  it("creates one map entry per unique user", () => {
    const data = [
      makeReportData("alice", "2026-05-01"),
      makeReportData("bob", "2026-05-01"),
      makeReportData("alice", "2026-05-02"),
    ];
    const result = transformCopilotMetricsReportData(data);
    expect(result.size).toBe(2);
    expect(result.has("alice")).toBe(true);
    expect(result.has("bob")).toBe(true);
  });

  it("groups multiple days for the same user", () => {
    const data = [
      makeReportData("alice", "2026-05-01"),
      makeReportData("alice", "2026-05-02"),
      makeReportData("alice", "2026-05-03"),
    ];
    const result = transformCopilotMetricsReportData(data);
    expect(result.get("alice")).toHaveLength(3);
  });

  it("sets total_active_users to 1 for each daily entry", () => {
    const data = [makeReportData("alice", "2026-05-01")];
    const output = transformCopilotMetricsReportData(data).get("alice")![0];
    expect(output.total_active_users).toBe(1);
  });

  it("maps used_agent correctly", () => {
    const data = [
      makeReportData("alice", "2026-05-01", { used_agent: true }),
      makeReportData("bob", "2026-05-01", { used_agent: false }),
    ];
    const result = transformCopilotMetricsReportData(data);
    expect(result.get("alice")![0].used_agent).toBe(true);
    expect(result.get("bob")![0].used_agent).toBe(false);
  });

  it("defaults used_agent to false when not provided", () => {
    const data = [makeReportData("alice", "2026-05-01")];
    const output = transformCopilotMetricsReportData(data).get("alice")![0];
    expect(output.used_agent).toBe(false);
  });

  it("sets total_ide_engaged_users=1 when user_initiated_interaction_count > 0", () => {
    const data = [
      makeReportData("alice", "2026-05-01", { user_initiated_interaction_count: 5 }),
      makeReportData("bob", "2026-05-01", { user_initiated_interaction_count: 0 }),
    ];
    const result = transformCopilotMetricsReportData(data);
    expect(result.get("alice")![0].total_ide_engaged_users).toBe(1);
    expect(result.get("bob")![0].total_ide_engaged_users).toBe(0);
  });

  it("maps total_lines_added and total_lines_deleted from loc sums", () => {
    const data = [
      makeReportData("alice", "2026-05-01", {
        loc_added_sum: 200,
        loc_deleted_sum: 75,
      }),
    ];
    const output = transformCopilotMetricsReportData(data).get("alice")![0];
    expect(output.total_lines_added).toBe(200);
    expect(output.total_lines_deleted).toBe(75);
  });

  it("maps chat mode request counts from totals_by_feature", () => {
    const data = [
      makeReportData("alice", "2026-05-01", {
        user_initiated_interaction_count: 20,
        totals_by_feature: [
          makeFeature("chat_panel_agent_mode", { user_initiated_interaction_count: 10 }),
          makeFeature("chat_panel_ask_mode", { user_initiated_interaction_count: 5 }),
          makeFeature("chat_inline", { user_initiated_interaction_count: 3 }),
          makeFeature("agent_edit", { user_initiated_interaction_count: 2 }),
          makeFeature("chat_panel_custom_mode", { user_initiated_interaction_count: 1 }),
        ],
      }),
    ];
    const output = transformCopilotMetricsReportData(data).get("alice")![0];
    expect(output.chat_requests_agent).toBe(10);
    expect(output.chat_requests_ask).toBe(5);
    expect(output.chat_requests_inline).toBe(3);
    expect(output.chat_requests_edit).toBe(2);
    expect(output.chat_requests_custom).toBe(1);
  });

  it("maps code_completion feature to completion-specific fields", () => {
    const data = [
      makeReportData("alice", "2026-05-01", {
        totals_by_feature: [
          makeFeature("code_completion", {
            code_generation_activity_count: 80,
            code_acceptance_activity_count: 40,
            loc_suggested_to_add_sum: 300,
            loc_added_sum: 200,
          }),
        ],
      }),
    ];
    const output = transformCopilotMetricsReportData(data).get("alice")![0];
    expect(output.code_completion_suggestions).toBe(80);
    expect(output.code_completion_acceptances).toBe(40);
    expect(output.code_completion_lines_suggested).toBe(300);
    expect(output.code_completion_lines_accepted).toBe(200);
  });

  it("maps used_chat and used_cli flags", () => {
    const data = [
      makeReportData("alice", "2026-05-01", { used_chat: true, used_cli: true }),
    ];
    const output = transformCopilotMetricsReportData(data).get("alice")![0];
    expect(output.total_chat_engaged_users).toBe(1);
    expect(output.total_cli_engaged_users).toBe(1);
  });

  it("passes through totals_by_feature and totals_by_model_feature arrays", () => {
    const features = [makeFeature("code_completion", { loc_added_sum: 10 })];
    const data = [
      makeReportData("alice", "2026-05-01", { totals_by_feature: features }),
    ];
    const output = transformCopilotMetricsReportData(data).get("alice")![0];
    expect(output.totals_by_feature).toHaveLength(1);
    expect(output.totals_by_feature![0].feature).toBe("code_completion");
  });

  it("skips entries with invalid day values", () => {
    const data = [
      makeReportData("alice", "not-a-date"),
      makeReportData("alice", "2026-05-01"),
    ];
    const result = transformCopilotMetricsReportData(data);
    // Only the valid entry should be stored
    expect(result.get("alice")).toHaveLength(1);
    expect(result.get("alice")![0].day).toBe("2026-05-01");
  });

  it("sorts entries by date ascending for each user", () => {
    const data = [
      makeReportData("alice", "2026-05-03"),
      makeReportData("alice", "2026-05-01"),
      makeReportData("alice", "2026-05-02"),
    ];
    const entries = transformCopilotMetricsReportData(data).get("alice")!;
    expect(entries[0].day).toBe("2026-05-01");
    expect(entries[1].day).toBe("2026-05-02");
    expect(entries[2].day).toBe("2026-05-03");
  });
});
