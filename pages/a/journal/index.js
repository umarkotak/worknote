import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { ExternalLink, LoaderCircle, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import AppLayout from "@/components/layouts/AppLayout";

const PAGE_LIMIT = 10;

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function JournalIndexPage() {
  const router = useRouter();
  const [cookies, , removeCookie] = useCookies(["auth_token"]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const modalRef = useRef(null);

  const [journals, setJournals] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    video_url: "",
    content: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const hasMore = journals.length < total;
  const sentinelRef = useRef(null);

  const fetchJournals = useCallback(async (nextPage, reset = false) => {
    if (reset) {
      setIsLoadingList(true);
    } else {
      setIsLoadingMore(true);
    }

    const { data, error } = await api.listJournals({ page: nextPage, limit: PAGE_LIMIT });

    if (error) {
      toast.error(error.message || "Failed to load journals");
      setIsLoadingList(false);
      setIsLoadingMore(false);
      return;
    }

    const incoming = data?.data || [];
    setTotal(data?.total || 0);
    setPage(nextPage);

    setJournals((prev) => {
      if (reset) return incoming;
      return [...prev, ...incoming];
    });

    setIsLoadingList(false);
    setIsLoadingMore(false);
  }, []);

  useEffect(() => {
    const onOutside = (event) => {
      if (isCreateOpen && modalRef.current && !modalRef.current.contains(event.target)) {
        setIsCreateOpen(false);
      }
    };

    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [isCreateOpen]);

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
      } else {
        setUser(data);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [cookies.auth_token, removeCookie, router]);

  useEffect(() => {
    if (!user) return;
    fetchJournals(1, true);
  }, [user, fetchJournals]);

  useEffect(() => {
    if (!sentinelRef.current || !user) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore && !isLoadingList) {
          fetchJournals(page + 1, false);
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchJournals, hasMore, isLoadingList, isLoadingMore, page, user]);

  const handleLogout = () => {
    removeCookie("auth_token", { path: "/" });
    router.push("/login");
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateJournal = async (event) => {
    event.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    const payload = {
      title: formData.title.trim(),
      video_url: formData.video_url.trim(),
      content: formData.content.trim(),
    };

    const { error } = await api.createJournal(payload);
    setIsCreating(false);

    if (error) {
      toast.error(error.message || "Failed to create journal");
      return;
    }

    setIsCreateOpen(false);
    setFormData({ title: "", video_url: "", content: "" });
    await fetchJournals(1, true);
  };

  const handleDeleteJournal = async (journalId) => {
    if (deletingId) return;
    if (!confirm("Delete this journal?")) return;

    setDeletingId(journalId);
    const { error } = await api.deleteJournal(journalId);
    setDeletingId(null);

    if (error) {
      toast.error(error.message || "Failed to delete journal");
      return;
    }

    await fetchJournals(1, true);
    toast.success("Journal deleted");
  };

  return (
    <AppLayout
      user={user}
      onLogout={handleLogout}
      isLoading={isLoading}
      loadingText="Loading journals..."
    >
      <main className="mx-auto flex h-[calc(100vh-56px)] w-full max-w-[1600px] min-h-0 px-2 pb-2">
        <section className="flex min-h-0 w-full flex-col overflow-hidden bg-[#1b1b1d]">
          <div className="flex items-center justify-between bg-[#202225] px-3 py-2">
            <div>
              <h1 className="font-[var(--font-heading)] text-lg text-[#f3f3f3]">My Journal</h1>
              <p className="text-xs text-[#9da1a6]">Video notes and reflections</p>
            </div>
            <Button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="h-8 bg-[#007acc] px-3 text-xs font-semibold text-white hover:bg-[#0e639c]"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Journal
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-0 py-0">
            {isLoadingList ? (
              <div className="flex h-full items-center justify-center text-sm text-[#9da1a6]">Loading journals...</div>
            ) : journals.length === 0 ? (
              <div className="flex h-full items-center justify-center bg-[#1f1f1f] text-sm text-[#9da1a6]">
                No journals yet. Create your first entry.
              </div>
            ) : (
              <div className="overflow-hidden bg-[#1b1b1d]">
                <table className="w-full table-fixed border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#202225]">
                    <tr>
                      <th className="w-28 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#9da1a6]">Thumbnail</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#9da1a6]">Title</th>
                      <th className="w-44 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#9da1a6]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journals.map((journal) => (
                      <tr key={journal.id} className="align-middle transition-colors hover:bg-[#1f2226]">
                        <td className="px-3 py-2">
                          <div className="h-14 w-24 overflow-hidden bg-[#202225]">
                            {journal.thumbnail_url ? (
                              <img src={journal.thumbnail_url} alt={journal.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] text-[#8f9397]">No image</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <p className="truncate text-sm font-semibold text-[#e8e8e8]">{journal.title}</p>
                          <p className="mt-0.5 truncate text-xs text-[#b4b4b4]">{journal.video_title || "Untitled video"}</p>
                          <p className="mt-0.5 truncate text-xs text-[#8f9397]">{formatDate(journal.created_at)}</p>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/a/journal/${journal.id}`}
                              className="inline-flex h-7 items-center gap-1.5 bg-[#202225] px-2.5 text-xs font-semibold text-[#9cdcfe] hover:bg-[#2a2d31]"
                            >
                              Open
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteJournal(journal.id)}
                              disabled={deletingId === journal.id}
                              className="inline-flex h-7 items-center gap-1 bg-[#331b1b] px-2.5 text-xs font-semibold text-[#f48771] hover:bg-[#412020] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {deletingId === journal.id ? (
                                <LoaderCircle className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div ref={sentinelRef} className="h-2" />
                {isLoadingMore && (
                  <div className="flex items-center justify-center py-2 text-xs text-[#9da1a6]">
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Loading more...
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-3">
          <div ref={modalRef} className="w-full max-w-lg bg-[#202225] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="font-[var(--font-heading)] text-lg text-[#f3f3f3]">Create Journal</h3>
              <button
                type="button"
                onClick={() => !isCreating && setIsCreateOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center bg-[#1b1d20] text-[#9da1a6] hover:bg-[#2d2d30]"
                aria-label="Close create journal modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJournal} className="space-y-3 px-4 py-4">
              <div>
                <label htmlFor="title" className="mb-1 block text-xs font-medium text-[#d4d4d4]">Title</label>
                <input
                  id="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  disabled={isCreating}
                  className="h-9 w-full bg-[#17181b] px-3 text-sm text-[#d4d4d4] outline-none focus:ring-1 focus:ring-[#007acc]"
                  placeholder="My YouTube Notes"
                />
              </div>

              <div>
                <label htmlFor="video_url" className="mb-1 block text-xs font-medium text-[#d4d4d4]">Video URL</label>
                <input
                  id="video_url"
                  type="url"
                  required
                  value={formData.video_url}
                  onChange={(e) => handleChange("video_url", e.target.value)}
                  disabled={isCreating}
                  className="h-9 w-full bg-[#17181b] px-3 text-sm text-[#d4d4d4] outline-none focus:ring-1 focus:ring-[#007acc]"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label htmlFor="content" className="mb-1 block text-xs font-medium text-[#d4d4d4]">Initial Notes (optional)</label>
                <textarea
                  id="content"
                  rows={4}
                  value={formData.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  disabled={isCreating}
                  className="w-full bg-[#17181b] px-3 py-2 text-sm text-[#d4d4d4] outline-none focus:ring-1 focus:ring-[#007acc]"
                  placeholder="Key points from this video..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCreating}
                  onClick={() => setIsCreateOpen(false)}
                  className="h-8 bg-[#17181b] text-[#d4d4d4] hover:bg-[#2d2d30]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="h-8 bg-[#007acc] text-white hover:bg-[#0e639c] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCreating ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
