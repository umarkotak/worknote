import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import {
  Check,
  ClipboardCopy,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

const PAGE_LIMIT = 20;

const initialForm = {
  title: "",
  tags: "",
  content: "",
};

function formatDate(value) {
  if (!value) return "Just now";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeTags(input) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function matchesSearch(item, query) {
  if (!query) return true;

  const keyword = query.toLowerCase();
  return [item.title, item.content].some((value) => (value || "").toLowerCase().includes(keyword));
}

export default function ClipboardsPage() {
  const router = useRouter();
  const [cookies, , removeCookie] = useCookies(["auth_token"]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [listError, setListError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const loadMoreRef = useRef(null);
  const nextCursorRef = useRef(0);

  useEffect(() => {
    const checkAuth = async () => {
      if (!cookies.auth_token) {
        router.push("/login");
        return;
      }

      const { data, error } = await api.getCurrentUser();

      if (error) {
        removeCookie("auth_token", { path: "/" });
        router.push("/login");
        return;
      }

      setUser(data);
      setIsLoading(false);
    };

    checkAuth();
  }, [cookies.auth_token, removeCookie, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!copiedId) return undefined;

    const timer = window.setTimeout(() => setCopiedId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  const resetComposer = useCallback(() => {
    setForm(initialForm);
    setEditingId(null);
  }, []);

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
        const unique = [];
        const seen = new Set();

        merged.forEach((item) => {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
          }
        });

        return unique;
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
    if (!hasMore || isFetchingList || isFetchingMore) return undefined;
    if (!loadMoreRef.current) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadClipboards();
        }
      },
      { rootMargin: "180px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetchingList, isFetchingMore, loadClipboards]);

  useEffect(() => {
    if (!items.length) {
      setActiveId(null);
      return;
    }

    if (!activeId || !items.some((item) => item.id === activeId)) {
      setActiveId(items[0].id);
    }
  }, [activeId, items]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) || null,
    [activeId, items]
  );

  const handleLogout = useCallback(() => {
    removeCookie("auth_token", { path: "/" });
    router.push("/login");
  }, [removeCookie, router]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleEdit = useCallback((item) => {
    setEditingId(item.id);
    setActiveId(item.id);
    setForm({
      title: item.title || "",
      tags: (item.tags || []).join(", "),
      content: item.content || "",
    });
  }, []);

  const handleCopy = useCallback(async (item) => {
    try {
      await navigator.clipboard.writeText(item.content || "");
      setCopiedId(item.id);
      setActiveId(item.id);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error(error.message || "Failed to copy");
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.content.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    setIsSaving(true);

    const payload = {
      title: form.title.trim(),
      tags: normalizeTags(form.tags),
      content: form.content,
    };

    const result = editingId
      ? await api.updateClipboard(editingId, payload)
      : await api.createClipboard(payload);

    if (result.error) {
      toast.error(result.error.message || "Failed to save clipboard item");
      setIsSaving(false);
      return;
    }

    const savedItem = result.data;
    const shouldShowSavedItem = matchesSearch(savedItem, debouncedSearch);

    if (editingId) {
      setItems((prev) => {
        if (!shouldShowSavedItem) {
          return prev.filter((item) => item.id !== editingId);
        }

        return prev.map((item) => (item.id === editingId ? savedItem : item));
      });
      toast.success("Clipboard item updated");
    } else {
      if (shouldShowSavedItem) {
        setItems((prev) => [savedItem, ...prev.filter((item) => item.id !== savedItem.id)]);
      }
      toast.success("Clipboard item saved");
    }

    setActiveId(shouldShowSavedItem ? savedItem.id : null);
    resetComposer();
    setIsSaving(false);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.title || "this clipboard item"}?`)) {
      return;
    }

    const { error } = await api.deleteClipboard(item.id);

    if (error) {
      toast.error(error.message || "Failed to delete clipboard item");
      return;
    }

    setItems((prev) => prev.filter((entry) => entry.id !== item.id));

    if (editingId === item.id) {
      resetComposer();
    }

    if (activeId === item.id) {
      setActiveId(null);
    }

    toast.success("Clipboard item deleted");
  };

  return (
    <AppLayout
      user={user}
      onLogout={handleLogout}
      isLoading={isLoading}
      loadingText="Loading clipboard..."
    >
      <main className="mx-auto min-h-[calc(100vh-56px)] w-full max-w-[1600px] px-2 py-2 sm:px-3">
        <div className="grid gap-2 xl:grid-cols-[380px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-[20px] border border-[#3c3c3c] bg-[linear-gradient(180deg,#252526_0%,#1f1f1f_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.28)] xl:sticky xl:top-[64px] xl:h-fit">
            <div className="border-b border-[#3c3c3c] px-4 py-4 sm:px-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#264f78] bg-[#102c45] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9cdcfe]">
                Fast notes
              </div>
              <h1 className="mt-3 font-[var(--font-heading)] text-2xl text-[#f3f3f3] sm:text-[30px]">
                Online clipboard
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#9da1a6]">
                Save quick snippets, search in seconds, and copy from any device without the usual clutter.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-[#9da1a6]">
                  Title
                </label>
                <Input
                  value={form.title}
                  onChange={handleChange("title")}
                  placeholder="Wi-Fi password, support reply..."
                  className="border-[#3c3c3c] bg-[#181818] text-[#f3f3f3] placeholder:text-[#6f7479] focus-visible:ring-[#007acc]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-[#9da1a6]">
                  Tags
                </label>
                <Input
                  value={form.tags}
                  onChange={handleChange("tags")}
                  placeholder="work, code, personal"
                  className="border-[#3c3c3c] bg-[#181818] text-[#f3f3f3] placeholder:text-[#6f7479] focus-visible:ring-[#007acc]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-[#9da1a6]">
                  Content
                </label>
                <textarea
                  value={form.content}
                  onChange={handleChange("content")}
                  placeholder="Paste anything you want to keep handy..."
                  rows={10}
                  className="min-h-[220px] w-full rounded-xl border border-[#3c3c3c] bg-[#181818] px-3 py-3 text-sm leading-6 text-[#f3f3f3] outline-none transition focus:ring-2 focus:ring-[#007acc]/70"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-10 flex-1 rounded-xl bg-[#007acc] text-white hover:bg-[#0e639c] sm:flex-none"
                >
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingId ? "Update item" : "Save item"}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetComposer}
                    className="h-10 rounded-xl border-[#3c3c3c] bg-[#252526] text-[#d4d4d4] hover:bg-[#2d2d30]"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#3c3c3c] bg-[#252526] shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
            <div className="border-b border-[#3c3c3c] px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-[var(--font-heading)] text-xl text-[#f3f3f3]">Your snippets</h2>
                  <p className="mt-1 text-sm text-[#9da1a6]">Search title or content. New items appear instantly at the top.</p>
                </div>

                <div className="relative w-full max-w-xl">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7479]" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search snippets"
                    className="h-11 rounded-xl border-[#3c3c3c] bg-[#1a1a1a] pl-10 text-[#f3f3f3] placeholder:text-[#6f7479] focus-visible:ring-[#007acc]"
                  />
                </div>
              </div>
            </div>

            {listError ? (
              <div className="m-4 rounded-2xl border border-[#5a1d1d] bg-[#3a1717] px-4 py-3 text-sm text-[#f48771]">
                {listError}
              </div>
            ) : null}

            <div className="grid min-h-[480px] gap-px bg-[#3c3c3c] lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.85fr)]">
              <div className="min-h-[320px] bg-[#1d1d1d]">
                {isFetchingList ? (
                  <div className="flex h-full min-h-[320px] items-center justify-center gap-2 text-sm text-[#9da1a6]">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading snippets...
                  </div>
                ) : items.length ? (
                  <div className="max-h-[72vh] overflow-y-auto">
                    {items.map((item) => {
                      const isActive = item.id === activeId;
                      const isCopied = item.id === copiedId;

                      return (
                        <article
                          key={item.id}
                          className={`border-b border-[#2f2f2f] px-4 py-4 transition ${
                            isActive ? "bg-[#0f2f47]" : "bg-[#1d1d1d] hover:bg-[#232326]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveId(item.id)}
                            className="block w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold text-[#f3f3f3]">
                                  {item.title || "Untitled snippet"}
                                </h3>
                                <p className="mt-1 text-xs text-[#8f9397]">Updated {formatDate(item.updated_at)}</p>
                              </div>
                              <span className="rounded-full border border-[#3c3c3c] bg-[#141414] px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[#9da1a6]">
                                #{item.id}
                              </span>
                            </div>

                            <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[#c9cdd2]">
                              {item.content}
                            </p>
                          </button>

                          {!!item.tags?.length && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.tags.map((tag) => (
                                <span
                                  key={`${item.id}-${tag}`}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#3c3c3c] bg-[#252526] px-2.5 py-1 text-[11px] text-[#9cdcfe]"
                                >
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleCopy(item)}
                              className="rounded-lg bg-[#007acc] text-white hover:bg-[#0e639c]"
                            >
                              {isCopied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                              {isCopied ? "Copied" : "Copy"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                              className="rounded-lg border-[#3c3c3c] bg-[#252526] text-[#d4d4d4] hover:bg-[#2d2d30]"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item)}
                              className="rounded-lg text-[#f48771] hover:bg-[#3a1717] hover:text-[#ffb4a5]"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </article>
                      );
                    })}

                    <div ref={loadMoreRef} className="flex min-h-16 items-center justify-center px-4 py-4 text-sm text-[#8f9397]">
                      {isFetchingMore ? (
                        <span className="inline-flex items-center gap-2">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Loading more...
                        </span>
                      ) : hasMore ? (
                        "Scroll for more"
                      ) : (
                        "You are all caught up"
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
                    <div className="rounded-full border border-[#3c3c3c] bg-[#252526] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9cdcfe]">
                      Empty board
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-[#f3f3f3]">No snippets yet</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-[#8f9397]">
                      Save your first shortcut, command, note, or reply template to start building your personal clipboard.
                    </p>
                  </div>
                )}
              </div>

              <aside className="min-h-[320px] bg-[radial-gradient(circle_at_top,#113853_0%,#252526_42%,#202020_100%)] p-4 sm:p-5">
                {activeItem ? (
                  <div className="flex h-full flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7fb7dd]">
                          Quick preview
                        </p>
                        <h3 className="mt-2 font-[var(--font-heading)] text-2xl text-white">
                          {activeItem.title || "Untitled snippet"}
                        </h3>
                        <p className="mt-2 text-sm text-[#b6c0c9]">Updated {formatDate(activeItem.updated_at)}</p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleCopy(activeItem)}
                        className="rounded-lg bg-white text-[#0f2f47] hover:bg-[#dfe8ef]"
                      >
                        <ClipboardCopy className="h-4 w-4" />
                        Copy text
                      </Button>
                    </div>

                    {!!activeItem.tags?.length && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeItem.tags.map((tag) => (
                          <span
                            key={`preview-${activeItem.id}-${tag}`}
                            className="rounded-full border border-[#315978] bg-[#18364c] px-2.5 py-1 text-xs text-[#d5ecff]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex-1 overflow-hidden rounded-2xl border border-[#315978] bg-[#0d2232]/80 p-4">
                      <pre className="h-full overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-6 text-[#e7f3ff]">
                        {activeItem.content}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[280px] items-center justify-center text-center text-sm text-[#b6c0c9]">
                    Pick a snippet to preview it here.
                  </div>
                )}
              </aside>
            </div>
          </section>
        </div>
      </main>
    </AppLayout>
  );
}
