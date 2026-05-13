"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "../dashboard-state";
import { ChartHeader } from "@/features/common/chart-header";
import { getTopModels } from "./common";

const MODEL_NAME_MAP: Record<string, string> = {
  'auto': 'Auto-detect',
  'claude-4.5-haiku': 'Claude 4.5 Haiku',
  'claude-4.5-sonnet': 'Claude 4.5 Sonnet',
  'claude-4.6-sonnet': 'Claude 4.6 Sonnet',
  'claude-opus-4.6': 'Claude 4.6 Opus',
  'claude-opus-4.7': 'Claude 4.7 Opus',
  'claude-sonnet-4.6': 'Claude 4.6 Sonnet',
  'gemini-3.1-pro': 'Gemini 3.1 Pro',
  'gpt-3.5': 'GPT-3.5',
  'gpt-4.1': 'GPT-4.1',
  'gpt-4o': 'GPT-4o',
  'gpt-5.3-codex': 'GPT-5.3 Codex',
  'gpt-5.4': 'GPT-5.4',
  'grok-code-fast-1': 'Grok Code Fast 1',
  'others': 'Other Models',
  'unknown': 'Unknown Model'
};

export const TopThreeModel = () => {
  const { displayData, isLoading } = useDashboard();
  const topModels = isLoading ? [] : getTopModels(displayData, 3);

  return (
    <Card className="flex flex-col min-h-[140px]">
      <ChartHeader
        title="Top 3 models"
        description="By user-initiated interactions (requests)"
        tip="The top 3 AI models ranked by total user-initiated interactions (requests sent by users) across all features in the selected period."
      />
      <CardContent className="flex flex-col justify-center flex-1 gap-3 py-0 pb-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">...</div>
        ) : topModels.length === 0 ? (
          <div className="text-sm text-muted-foreground">No data</div>
        ) : (
          topModels.map((entry, idx) => (
            <div key={entry.model} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground w-4 shrink-0">
                {idx + 1}
              </span>
              <span className="text-sm font-medium flex-1 truncate" title={entry.model}>
                {MODEL_NAME_MAP[entry.model] || entry.model}
              </span>
              <span className="text-sm text-muted-foreground shrink-0">
                {entry.interactions.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
