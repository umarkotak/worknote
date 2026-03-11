import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import api from "@/lib/api";

const COMPOSER_MAX_HEIGHT = 180;
const ENTRY_MAX_HEIGHT = 280;

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
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatSidebarDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function getMonthDateRange(monthKey) {
  const [year, month] = monthKey.split("-");
  const startDate = `${year}-${month}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${month}-${lastDay}`;

  return { startDate, endDate };
}

function resizeTextarea(textarea, maxHeight) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
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
  const composerRef = useRef(null);
  const logRefs = useRef({});
  const entryTextareaRefs = useRef({});
  const saveTimerRef = useRef({});
  const pendingBottomScrollRef = useRef(false);

  const [content, setContent] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [editContent, setEditContent] = useState({});
  const [savingLogs, setSavingLogs] = useState({});
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const [sidebarMonths, setSidebarMonths] = useState({});
  const [downloadingMonth, setDownloadingMonth] = useState(null);
  const [activeLogId, setActiveLogId] = useState(null);

  const sortedLogs = useMemo(
    () => [...workLogs].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [workLogs]
  );

  const monthGroups = useMemo(() => {
    return sortedLogs.reduce((groups, log) => {
      const key = getMonthKey(log.date);
      if (!groups[key]) {
        groups[key] = {
          monthKey: key,
          monthLabel: formatMonthYear(log.date),
          logs: [],
        };
      }

      groups[key].logs.push(log);
      return groups;
    }, {});
  }, [sortedLogs]);

  const monthEntries = useMemo(() => Object.values(monthGroups), [monthGroups]);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    resizeTextarea(composerRef.current, COMPOSER_MAX_HEIGHT);
  }, [content]);

  useEffect(() => {
    sortedLogs.forEach((log) => {
      resizeTextarea(entryTextareaRefs.current[log.id], ENTRY_MAX_HEIGHT);
    });
  }, [sortedLogs, editContent]);

  useEffect(() => {
    if (sortedLogs.length === 0) return;

    if (pendingBottomScrollRef.current) {
      pendingBottomScrollRef.current = false;
      scrollToBottom("smooth");
      return;
    }

    scrollToBottom("auto");
  }, [sortedLogs.length, scrollToBottom]);

  useEffect(() => {
    return () => {
      Object.values(saveTimerRef.current).forEach(clearTimeout);
    };
  }, []);

  const handleEditChange = useCallback(
    (logId, value) => {
      setEditContent((prev) => ({
        ...prev,
        [logId]: value,
      }));

      if (saveTimerRef.current[logId]) {
        clearTimeout(saveTimerRef.current[logId]);
      }

      const log = sortedLogs.find((item) => item.id === logId);
      if (!log) return;

      setSavingLogs((prev) => ({ ...prev, [logId]: true }));

      saveTimerRef.current[logId] = setTimeout(async () => {
        try {
          await onSave({
            date: formatDateForInput(log.date),
            content: value,
          });
        } catch (error) {
          toast.error(error.message || "Failed to save");
        } finally {
          setSavingLogs((prev) => ({ ...prev, [logId]: false }));
        }
      }, 2000);
    },
    [onSave, sortedLogs]
  );

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      pendingBottomScrollRef.current = true;
      await onSave({ date: selectedDate, content, append: true });
      setContent("");
      setSelectedDate(new Date().toISOString().split("T")[0]);
      toast.success("Work log added");
    } catch (error) {
      pendingBottomScrollRef.current = false;
      toast.error(error.message || "Failed to add work log");
    }
  };

  const toggleMonthCollapse = (monthKey) => {
    setCollapsedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const toggleSidebarMonth = (monthKey) => {
    setSidebarMonths((prev) => ({
      ...prev,
      [monthKey]: prev[monthKey] === false,
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

  const handleJumpToLog = (log) => {
    const monthKey = getMonthKey(log.date);
    setActiveLogId(log.id);

    setCollapsedMonths((prev) => ({
      ...prev,
      [monthKey]: false,
    }));

    onMonthSelect?.(monthKey);

    requestAnimationFrame(() => {
      logRefs.current[log.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  return (
    <div className="flex h-full min-h-0 bg-[var(--surface-canvas)] text-foreground">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-[var(--surface-1)] px-2 py-2 lg:flex">
        <div className="mb-2 px-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Jump to</p>
          <p className="mt-1 text-xs text-muted-foreground">Browse logs by month and date.</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {monthEntries.map((month) => {
            const isOpen = sidebarMonths[month.monthKey] !== false;
            const isActive = selectedMonth === month.monthKey;

            return (
              <div key={month.monthKey} className="paper-panel-soft mb-1.5 rounded-lg">
                <button
                  type="button"
                  className={`flex w-full items-center justify-between px-2 py-1.5 text-left transition-colors ${
                    isActive ? "bg-[var(--surface-3)] text-[var(--ink-strong)]" : "text-foreground hover:bg-[var(--surface-2)]"
                  }`}
                  onClick={() => toggleSidebarMonth(month.monthKey)}
                >
                  <span className="text-[13px] font-medium">{month.monthLabel}</span>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {isOpen && (
                  <div className="space-y-0.5 pb-0.5">
                    {month.logs.map((log) => {
                      const dateKey = formatDateForInput(log.date);
                      return (
                        <button
                          key={dateKey}
                          type="button"
                          className="flex w-full items-center justify-between px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-[var(--surface-2)] hover:text-foreground"
                          onClick={() => handleJumpToLog(log)}
                        >
                          <span>{formatSidebarDate(log.date)}</span>
                          <span className="ml-3 truncate text-[10px] text-[var(--ink-faint)]">{dateKey}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col bg-[var(--surface-canvas)]">
        <div ref={containerRef} className="relative flex-1 overflow-y-auto px-0 py-0">
          {sortedLogs.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4 text-muted-foreground">
              <div className="paper-panel rounded-xl px-6 py-8 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-sm text-foreground">No work logs yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Add your first entry below.</p>
              </div>
            </div>
          ) : (
            <div className="pb-16">
              {monthEntries.map((month) => {
                const isCollapsed = collapsedMonths[month.monthKey];
                const isActive = selectedMonth === month.monthKey;

                return (
                  <section key={month.monthKey}>
                    <div
                      className={`sticky top-0 z-10 px-3 py-2 backdrop-blur-sm transition-colors ${
                        isActive ? "bg-[rgba(229,203,186,0.85)]" : "bg-[rgba(250,245,236,0.94)] hover:bg-[var(--surface-2)]"
                      }`}
                      onClick={() => onMonthSelect?.(month.monthKey)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          className="flex items-center gap-2 px-0 py-0 text-sm text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMonthCollapse(month.monthKey);
                          }}
                        >
                          {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">{month.monthLabel}</span>
                          <span className="px-1.5 py-0 text-[11px] text-muted-foreground">{month.logs.length}</span>
                        </button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-muted-foreground hover:bg-[var(--surface-2)] hover:text-foreground"
                          title="Download Worklogs"
                          onClick={(e) => handleDownload(e, month.monthKey)}
                          disabled={downloadingMonth === month.monthKey}
                        >
                          {downloadingMonth === month.monthKey ? (
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border border-primary border-t-transparent" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div>
                        {month.logs.map((log) => {
                          const value = editContent[log.id] ?? log.content;
                          const isActiveLog = activeLogId === log.id;
                          return (
                            <div
                              key={log.id}
                              ref={(node) => {
                                logRefs.current[log.id] = node;
                              }}
                              className={`px-3 py-2 transition-colors ${
                                isActiveLog
                                  ? "bg-[var(--primary-soft)] shadow-[inset_3px_0_0_0_var(--primary)]"
                                  : isActive
                                    ? "bg-[var(--surface-1)]"
                                    : "bg-[var(--surface-canvas)] hover:bg-[var(--surface-1)]"
                               }`}
                              onClick={() => {
                                setActiveLogId(log.id);
                                onMonthSelect?.(month.monthKey);
                              }}
                            >
                              <div className="mb-1 flex items-center justify-between gap-3">
                                <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">{formatBubbleDate(log.date)}</span>
                                {savingLogs[log.id] && (
                                  <div className="flex items-center gap-1 text-[10px] text-[var(--ink-faint)]">
                                    <div className="h-2.5 w-2.5 animate-spin rounded-full border border-primary border-t-transparent" />
                                    <span>Saving</span>
                                  </div>
                                )}
                              </div>

                              <textarea
                                ref={(node) => {
                                  entryTextareaRefs.current[log.id] = node;
                                  resizeTextarea(node, ENTRY_MAX_HEIGHT);
                                }}
                                value={value}
                                onChange={(e) => handleEditChange(log.id, e.target.value)}
                                onFocus={() => setActiveLogId(log.id)}
                                className={`min-h-[58px] w-full resize-none bg-transparent px-0 py-1 font-mono text-[13px] leading-6 text-foreground outline-none transition-opacity placeholder:text-[var(--ink-faint)] ${
                                  savingLogs[log.id] ? "opacity-80" : ""
                                }`}
                                placeholder="What did you work on?"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>

        <form onSubmit={handleAddLog} className="paper-topbar shrink-0 border-t border-border px-2 py-2 backdrop-blur sm:px-3">
          <div className="paper-panel flex items-end gap-2 rounded-xl px-2 py-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 shrink-0 rounded-md border border-input bg-input px-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
            />

            <textarea
              ref={composerRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                resizeTextarea(e.target, COMPOSER_MAX_HEIGHT);
              }}
              placeholder="Write your work log. Enter for newline, Shift+Enter to submit."
              rows={1}
              className="max-h-[180px] min-h-[40px] flex-1 resize-none rounded-md border border-input bg-input px-3 py-2 font-mono text-[13px] leading-6 text-foreground outline-none placeholder:text-[var(--ink-faint)] focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  handleAddLog(e);
                }
              }}
            />

            <Button
              type="submit"
              disabled={!content.trim() || isLoading}
              className="h-10 px-4 text-sm font-medium"
            >
              Add
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
