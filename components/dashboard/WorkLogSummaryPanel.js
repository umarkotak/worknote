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
    <div className="w-[480px] border-l border-border bg-background flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-sm">Generating summary...</p>
            <p className="text-xs mt-1">This may take a moment</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
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
            {/* Summary Content */}
            <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-li:text-foreground prose-a:text-primary">
              <Markdown>{summary.summary}</Markdown>
            </div>

            {/* Metadata */}
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

            {/* Regenerate Button */}
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
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No summary yet
            </p>
            <p className="text-xs text-center mb-4 max-w-[200px]">
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
