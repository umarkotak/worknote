import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import api from "@/lib/api";

function getMonthKey(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

function formatMonthYear(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatBubbleDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getMonthDateRange(monthKey) {
  const [year, month] = monthKey.split("-");
  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${month}-${lastDay}`;

  return { startDate, endDate };
}

export default function WorkLogPanel({
  workLogs = [],
  onSave,
  isLoading,
  onMonthSelect,
  selectedMonth,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [content, setContent] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [editContent, setEditContent] = useState({});
  const [savingLogs, setSavingLogs] = useState({});
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [downloadingMonth, setDownloadingMonth] = useState(null);
  const saveTimerRef = useRef({});

  const sortedLogs = [...workLogs].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  useEffect(() => {
    if (sortedLogs.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [workLogs.length]);

  const handleEditChange = useCallback((logId, value) => {
    setEditContent((prev) => ({
      ...prev,
      [logId]: value,
    }));

    if (saveTimerRef.current[logId]) {
      clearTimeout(saveTimerRef.current[logId]);
    }

    const log = sortedLogs.find((l) => l.id === logId);
    setSavingLogs(prev => ({ ...prev, [logId]: true }));
    saveTimerRef.current[logId] = setTimeout(async () => {
      try {
        await onSave({
          date: formatDateForInput(log.date),
          content: value,
        });
      } catch (error) {
        toast.error(error.message || "Failed to save");
      } finally {
        setSavingLogs(prev => ({ ...prev, [logId]: false }));
      }
    }, 2000);
  }, [sortedLogs, onSave]);

  useEffect(() => {
    return () => {
      Object.values(saveTimerRef.current).forEach(clearTimeout);
    };
  }, []);

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await onSave({ date: selectedDate, content, append: true });
      setContent("");
      setSelectedDate(new Date().toISOString().split("T")[0]);
      toast.success("Work log added");

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      toast.error(error.message || "Failed to add work log");
    }
  };

  const toggleMonthCollapse = (monthKey) => {
    setCollapsedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const handleDownload = async (e, monthKey) => {
    e.stopPropagation();
    const { startDate, endDate } = getMonthDateRange(monthKey);
    setDownloadingMonth(monthKey);

    try {
      const { data, error } = await api.downloadWorkLogs(startDate, endDate);
      if (error) {
        toast.error(error.message || "Failed to download worklogs");
        return;
      }

      const blob = new Blob([data], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `worklogs-${monthKey}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Worklogs downloaded");
    } catch (error) {
      toast.error(error.message || "Failed to download worklogs");
    } finally {
      setDownloadingMonth(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* VSCode-style Log List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto relative"
      >
        {sortedLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4">
            <div className="text-center">
              <svg
                className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-xs">No work logs yet</p>
              <p className="text-xs mt-1 text-muted-foreground">Add your first entry below</p>
            </div>
          </div>
        ) : (
          sortedLogs.map((log, index) => {
            const prevLog = index > 0 ? sortedLogs[index - 1] : null;
            const monthKey = formatMonthYear(log.date);
            const showMonthHeader = !prevLog ||
              formatMonthYear(log.date) !== formatMonthYear(prevLog.date);
            const isCollapsed = collapsedMonths[monthKey];

            if (!showMonthHeader && collapsedMonths[formatMonthYear(log.date)]) {
              return null;
            }

            return (
              <React.Fragment key={log.id}>
                {/* Compact Month Header - VSCode style */}
                {showMonthHeader && (
                  <div
                    className={`sticky top-0 z-10 bg-[#1e1e1e]/95 backdrop-blur-sm border-b border-[#3c3c3c] px-3 py-1 cursor-pointer transition-colors ${
                      selectedMonth === getMonthKey(log.date)
                        ? "border-l-2 border-l-[#007acc]"
                        : "hover:bg-[#2a2a2d]/30"
                    }`}
                    onClick={() => onMonthSelect?.(getMonthKey(log.date))}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        className="flex items-center gap-1.5 hover:bg-[#2a2a2d]/50 rounded px-1.5 py-0.5 -ml-1.5 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMonthCollapse(monthKey);
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-3 w-3 text-[#9da1a6]" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-[#9da1a6]" />
                        )}
                        <span className="font-medium text-xs text-[#9cdcfe]">
                          {monthKey}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        title="Download Worklogs"
                        onClick={(e) => handleDownload(e, getMonthKey(log.date))}
                        disabled={downloadingMonth === getMonthKey(log.date)}
                      >
                        {downloadingMonth === getMonthKey(log.date) ? (
                          <div className="animate-spin h-3 w-3 border border-[#007acc] border-t-transparent rounded-full" />
                        ) : (
                          <Download className="h-3 w-3 text-[#9da1a6]" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Compact Log Entry - VSCode style */}
                {!isCollapsed && (
                  <div className="px-2 py-0.5 group">
                    <div
                      className={`flex gap-2 py-1 hover:bg-[#2a2a2d]/30 rounded px-1.5 transition-colors cursor-pointer ${
                        selectedMonth === getMonthKey(log.date) ? "bg-[#2a2a2d]/20" : ""
                      }`}
                      onClick={() => onMonthSelect?.(getMonthKey(log.date))}
                    >
                      {/* Line number style date indicator */}
                      <div className="flex-shrink-0 w-16 pt-1">
                        <span className="text-[10px] text-[#6e7681] font-mono select-none">
                          {formatBubbleDate(log.date)}
                        </span>
                      </div>

                      {/* Content area */}
                      <div className="flex-1 min-w-0">
                        {savingLogs[log.id] && (
                          <div className="text-[10px] text-[#6e7681] flex items-center gap-1 mb-0.5">
                            <div className="animate-spin h-2 w-2 border border-[#007acc] border-t-transparent rounded-full"></div>
                            <span>Saving...</span>
                          </div>
                        )}
                        <textarea
                          value={editContent[log.id] ?? log.content}
                          onChange={(e) => handleEditChange(log.id, e.target.value)}
                          rows={Math.max(2, (editContent[log.id] ?? log.content).split("\n").length)}
                          className={`w-full bg-transparent px-0 py-0.5 font-mono text-[12px] leading-[18px] text-[#d4d4d4] resize-none focus:outline-none ${savingLogs[log.id] ? "opacity-70" : ""}`}
                          placeholder="What did you work on?"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* Compact Input Bar at Bottom */}
      <form
        onSubmit={handleAddLog}
        className="shrink-0 border-t border-[#3c3c3c] bg-[#1e1e1e] p-2"
      >
        <div className="flex gap-2 items-start">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="shrink-0 rounded border border-[#3c3c3c] bg-[#252526] px-2 py-1 text-[11px] h-7 text-[#d4d4d4] focus:outline-none focus:ring-1 focus:ring-[#007acc]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you work on? Enter to add..."
            rows={1}
            className="flex-1 rounded border border-[#3c3c3c] bg-[#252526] px-2 py-1 text-[12px] h-7 font-mono leading-[18px] text-[#d4d4d4] resize-none focus:outline-none focus:ring-1 focus:ring-[#007acc]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddLog(e);
              }
            }}
          />
          <Button type="submit" disabled={!content.trim() || isLoading} className="h-7 px-3 text-xs">
            Add
          </Button>
        </div>
      </form>
    </div>
  );
}
