import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Check, ClipboardCopy, LoaderCircle, Pencil, Search, Trash2, X } from "lucide-react";

import { useDashboardSession } from "@/components/session/DashboardSessionProvider";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE = 250;
const LONG_PRESS_MS = 1000;
const EDITOR_MAX_HEIGHT = 220;

const emptyDraft = {
  title: "",
  tags: [],
  content: "",
};

function formatDate(value) {
  if (!value) return "Just now";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDraft(item) {
  if (!item) return emptyDraft;

  return {
    title: item.title || "",
    tags: item.tags || [],
    content: item.content || "",
  };
}

function resizeTextarea(textarea, maxHeight) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}

export default function ClipboardsPage() {
  const { user } = useDashboardSession();

  const [items, setItems] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [listError, setListError] = useState("");
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [showTitleField, setShowTitleField] = useState(false);

  const nextCursorRef = useRef(0);
  const composerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    resizeTextarea(composerRef.current, EDITOR_MAX_HEIGHT);
  }, [draft.content, editingId, showTitleField]);

  useEffect(() => {
    if (!copiedId) return undefined;
    const timer = window.setTimeout(() => setCopiedId(null), 1200);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  const loadClipboards = useCallback(
    async ({ reset = false, cursor } = {}) => {
      const currentCursor = reset ? 0 : cursor ?? nextCursorRef.current;

      if (reset) {
        setIsFetchingList(true);
      } else {
        setIsFetchingMore(true);
      }

      setListError("");

      const { data, error } = await api.listClipboards({
        search: debouncedSearch,
        cursor: currentCursor,
        limit: PAGE_LIMIT,
      });

      if (error) {
        setListError(error.message || "Failed to load clipboard items");
        if (reset) {
          setItems([]);
          setHasMore(false);
          nextCursorRef.current = 0;
        }
        setIsFetchingList(false);
        setIsFetchingMore(false);
        return;
      }

      const incoming = data?.data || [];
      setItems((prev) => {
        const merged = reset ? incoming : [...prev, ...incoming];
        const seen = new Set();

        return merged.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      });

      setHasMore(Boolean(data?.has_more));
      nextCursorRef.current = data?.next_cursor || 0;
      setIsFetchingList(false);
      setIsFetchingMore(false);
    },
    [debouncedSearch]
  );

  useEffect(() => {
    if (!user) return;
    loadClipboards({ reset: true, cursor: 0 });
  }, [user, debouncedSearch, loadClipboards]);

  useEffect(() => {
    if (!editingId) {
      setDraft(emptyDraft);
      setShowTitleField(false);
      return;
    }

    const activeItem = items.find((item) => item.id === editingId);
    if (!activeItem) {
      setEditingId(null);
      setDraft(emptyDraft);
      setShowTitleField(false);
      return;
    }

    setDraft(toDraft(activeItem));
    setShowTitleField(Boolean(activeItem.title));
  }, [editingId, items]);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCopy = useCallback(async (item) => {
    try {
      await navigator.clipboard.writeText(item.content || "");
      setCopiedId(item.id);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error(error.message || "Failed to copy");
    }
  }, []);

  const handleToggleSelection = useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const enterEditMode = useCallback((item) => {
    setSelectionMode(false);
    setSelectedIds([]);
    setEditingId(item.id);
    setDraft(toDraft(item));
    setShowTitleField(Boolean(item.title));
  }, []);

  const handleItemPointerDown = useCallback(
    (item) => {
      if (selectionMode) return;

      longPressTriggeredRef.current = false;
      clearLongPress();
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        enterEditMode(item);
      }, LONG_PRESS_MS);
    },
    [enterEditMode, selectionMode]
  );

  const handleItemPointerUp = useCallback(() => {
    clearLongPress();
  }, []);

  const handleItemClick = useCallback(
    async (item) => {
      if (longPressTriggeredRef.current) {
        longPressTriggeredRef.current = false;
        return;
      }

      if (selectionMode) {
        handleToggleSelection(item.id);
        return;
      }

      await handleCopy(item);
    },
    [handleCopy, handleToggleSelection, selectionMode]
  );

  const handleSave = async (event) => {
    event.preventDefault();

    if (!draft.content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    setIsSaving(true);

    const payload = {
      title: showTitleField ? draft.title.trim() : "",
      tags: draft.tags || [],
      content: draft.content,
    };

    const result = editingId
      ? await api.updateClipboard(editingId, payload)
      : await api.createClipboard(payload);

    setIsSaving(false);

    if (result.error) {
      toast.error(result.error.message || "Failed to save clipboard item");
      return;
    }

    const savedItem = result.data;

    if (editingId) {
      setItems((prev) => prev.map((item) => (item.id === editingId ? savedItem : item)));
      toast.success("Clipboard updated");
    } else {
      setItems((prev) => [savedItem, ...prev.filter((item) => item.id !== savedItem.id)]);
      toast.success("Clipboard added");
    }

    setEditingId(null);
    setDraft(emptyDraft);
    setShowTitleField(false);
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} clipboard item(s)?`)) return;

    setIsDeleting(true);
    const results = await Promise.all(
      selectedIds.map(async (id) => {
        const { error } = await api.deleteClipboard(id);
        return { id, error };
      })
    );
    setIsDeleting(false);

    const failed = results.filter((item) => item.error);
    const deletedIds = results.filter((item) => !item.error).map((item) => item.id);

    if (deletedIds.length) {
      setItems((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
    }

    if (editingId && deletedIds.includes(editingId)) {
      setEditingId(null);
      setDraft(emptyDraft);
      setShowTitleField(false);
    }

    setSelectedIds([]);
    setSelectionMode(false);

    if (failed.length) {
      toast.error(`Deleted ${deletedIds.length}, failed ${failed.length}`);
      return;
    }

    toast.success("Selected clipboard items deleted");
  };

  const topBarTitle = useMemo(() => {
    if (selectionMode) {
      return selectedIds.length ? `${selectedIds.length} selected` : "Select items";
    }

    return "Clipboard";
  }, [selectedIds.length, selectionMode]);

  return (
    <main className="mx-auto flex h-[calc(100vh-56px)] w-full max-w-[960px] min-h-0 px-0 pb-0 sm:px-2 sm:pb-2">
        <div className="flex min-h-0 w-full flex-col bg-[#1b1b1d] text-[#d4d4d4]">
          <div className="sticky top-0 z-20 bg-[#18181a]/95 px-2 py-2 backdrop-blur sm:px-3">
            <div className="space-y-2 bg-[#202225] px-2 py-2 sm:px-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#6e7681]">{topBarTitle}</p>
                  <p className="text-xs text-[#8b949e]">Tap to copy. Hold for 1 second to edit.</p>
                </div>

                {selectionMode ? (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectionMode(false);
                        setSelectedIds([]);
                      }}
                      className="h-8 px-2 text-[#8b949e] hover:bg-white/[0.05] hover:text-[#d4d4d4]"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleDeleteSelected}
                      disabled={!selectedIds.length || isDeleting}
                      className="h-8 px-2 text-[#f48771] hover:bg-[#3a1717] hover:text-[#ffb4a5]"
                    >
                      {isDeleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectionMode(true);
                      setEditingId(null);
                    }}
                    className="h-8 px-2 text-[#8b949e] hover:bg-white/[0.05] hover:text-[#d4d4d4]"
                  >
                    <Check className="h-4 w-4" />
                    Select
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 bg-[#17181b] px-2">
                <Search className="h-4 w-4 text-[#5f6772]" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search clipboard"
                  className="h-10 w-full bg-transparent text-sm text-[#d4d4d4] outline-none placeholder:text-[#5f6772]"
                />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-[150px] sm:pb-[170px]">
            {listError ? <div className="px-3 py-2 text-sm text-[#f48771]">{listError}</div> : null}

            {isFetchingList ? (
              <div className="flex items-center justify-center px-3 py-8 text-sm text-[#8b949e]">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Loading snippets...
              </div>
            ) : items.length ? (
              <div>
                {items.map((item) => {
                  const isEditing = editingId === item.id;
                  const isSelected = selectedIds.includes(item.id);
                  const isCopied = copiedId === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onPointerDown={() => handleItemPointerDown(item)}
                      onPointerUp={handleItemPointerUp}
                      onPointerLeave={handleItemPointerUp}
                      onPointerCancel={handleItemPointerUp}
                      onClick={() => handleItemClick(item)}
                      className={`block w-full border-b border-white/[0.03] px-3 py-2 text-left transition-colors sm:px-4 ${
                        isEditing
                          ? "bg-[#23262b]"
                          : isSelected
                            ? "bg-[#20303b]"
                            : "bg-[#1b1b1d] active:bg-[#23262b]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {selectionMode ? (
                          <span className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center border ${isSelected ? "border-[#2f81f7] bg-[#2f81f7] text-white" : "border-[#4b5560]"}`}>
                            {isSelected ? <Check className="h-3 w-3" /> : null}
                          </span>
                        ) : null}

                        <div className="min-w-0 flex-1">
                          {item.title ? <p className="truncate text-[13px] font-medium text-[#f3f3f3]">{item.title}</p> : null}
                          <p className={`whitespace-pre-wrap break-words font-mono text-[13px] leading-6 text-[#d4d4d4] ${item.title ? "mt-0.5 line-clamp-2" : "line-clamp-3"}`}>
                            {item.content}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6e7681]">
                            <span>{formatDate(item.updated_at)}</span>
                            {isCopied ? <span className="text-[#4ec9b0]">Copied</span> : null}
                            {isEditing ? <span className="text-[#9cdcfe]">Editing</span> : null}
                          </div>
                        </div>

                        {!selectionMode ? (
                          <span className="mt-1 shrink-0 text-[#5f6772]">
                            {isEditing ? <Pencil className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}

                <div className="px-3 py-3 text-center text-[11px] text-[#6e7681]">
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={() => loadClipboards()}
                      disabled={isFetchingMore}
                      className="text-[#8b949e] transition-colors hover:text-[#d4d4d4] disabled:opacity-50"
                    >
                      {isFetchingMore ? "Loading more..." : "Load more"}
                    </button>
                  ) : (
                    "End of list"
                  )}
                </div>
              </div>
            ) : (
              <div className="px-3 py-8 text-center text-sm text-[#8b949e]">No clipboard items yet.</div>
            )}
          </div>

          <form onSubmit={handleSave} className="sticky bottom-0 z-20 bg-[#18181a]/95 backdrop-blur ">
            <div className="space-y-2 bg-[#202225] px-2 py-2 sm:px-3">
              <div className="flex items-center justify-between gap-2 text-xs text-[#8b949e]">
                <span>{editingId ? "Edit" : "New"}</span>
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setDraft(emptyDraft);
                      setShowTitleField(false);
                    }}
                    className="text-[#8b949e] hover:text-[#d4d4d4]"
                  >
                    Stop editing
                  </button>
                ) : (
                  <button
                    type="submit"
                    size="sm"
                    disabled={!draft.content.trim() || isSaving}
                  >
                    {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : editingId ? "Save" : "Add"}
                  </button>
                )}
              </div>

              {showTitleField ? (
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Title"
                  className="h-10 w-full bg-[#17181b] px-3 text-sm text-[#d4d4d4] outline-none placeholder:text-[#5f6772] focus:ring-1 focus:ring-[#007acc]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTitleField(true)}
                  className="w-fit text-xs text-[#9cdcfe] hover:text-[#c7e9ff]"
                >
                  + Add title
                </button>
              )}

              <textarea
                ref={composerRef}
                value={draft.content}
                onChange={(event) => {
                  setDraft((prev) => ({ ...prev, content: event.target.value }));
                  resizeTextarea(event.target, EDITOR_MAX_HEIGHT);
                }}
                rows={1}
                placeholder="Paste anything. Shift+Enter to save."
                className="max-h-[220px] min-h-[44px] w-full resize-none bg-[#17181b] px-3 py-2 font-mono text-[13px] leading-6 text-[#d4d4d4] outline-none placeholder:text-[#5f6772] focus:ring-1 focus:ring-[#007acc]"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.shiftKey) {
                    event.preventDefault();
                    handleSave(event);
                  }
                }}
              />
            </div>
          </form>
        </div>
      </main>
  );
}
