import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, X } from "lucide-react";
import Markdown from "react-markdown";

function formatMonthDisplay(monthStr) {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatTimestamp(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function WorkLogSummaryPanel({
  selectedMonth,
  summary,
  isLoading,
  error,
  onGenerate,
  onClose,
}) {
  const hasSummary = summary && summary.summary;

  return (
    <div className="flex h-full w-[480px] flex-col border-l border-border bg-[var(--surface-canvas)]">
      <div className="shrink-0 border-b border-border bg-card px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-[var(--ink-strong)]">
            {formatMonthDisplay(selectedMonth)} Summary
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-sm">Generating summary...</p>
            <p className="text-xs mt-1">This may take a moment</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger-soft)]">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-sm text-center">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onGenerate}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : hasSummary ? (
          <div className="space-y-4">
            <div className="paper-panel prose prose-sm max-w-none rounded-xl p-4 text-foreground prose-headings:text-[var(--ink-strong)] prose-p:text-foreground prose-strong:text-[var(--ink-strong)] prose-code:text-foreground prose-li:text-foreground prose-a:text-primary">
              <Markdown>{summary.summary}</Markdown>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Generated: {formatTimestamp(summary.created_at)}
              </p>
              {summary.updated_at !== summary.created_at && (
                <p className="text-xs text-muted-foreground">
                  Updated: {formatTimestamp(summary.updated_at)}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onGenerate}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Summary
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Sparkles className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">
              No summary yet
            </p>
            <p className="mb-4 max-w-[200px] text-center text-xs">
              Generate an AI-powered summary of your work logs for{" "}
              {formatMonthDisplay(selectedMonth)}
            </p>
            <Button onClick={onGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Summary
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
