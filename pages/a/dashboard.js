import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { BookOpen, Briefcase, CalendarClock, ClipboardList, FileText, LoaderCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import AppLayout from "@/components/layouts/AppLayout";

const quickCards = [
  { title: "Daily Log", subtitle: "Record your day", href: "/a/worklogs", icon: FileText },
  { title: "Job Tracker", subtitle: "Manage opportunities", href: "/a/applications", icon: Briefcase },
  { title: "My Journal", subtitle: "Video learning notes", href: "/a/journal", icon: BookOpen },
  { title: "Clipboard", subtitle: "Keep snippets ready", href: "/a/clipboards", icon: ClipboardList },
];

function getTodayData(schedule) {
  const today = new Date().toISOString().slice(0, 10);
  return schedule.find((item) => item.tanggal_lengkap === today) || null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [cookies, , removeCookie] = useCookies(["auth_token"]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const [provinsi, setProvinsi] = useState("Jawa Barat");
  const [kabkota, setKabkota] = useState("Kota Bogor");
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [schedulePayload, setSchedulePayload] = useState(null);

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

  const fetchSholatSchedule = async () => {
    setIsFetchingSchedule(true);
    setScheduleError("");

    try {
      const response = await fetch("https://equran.id/api/v2/shalat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provinsi,
          kabkota,
          bulan: Number(bulan),
          tahun: Number(tahun),
        }),
      });

      const payload = await response.json();
      if (!response.ok || payload?.code !== 200) {
        setScheduleError(payload?.message || "Failed to fetch sholat schedule");
        setSchedulePayload(null);
        setIsFetchingSchedule(false);
        return;
      }

      setSchedulePayload(payload.data);
    } catch (error) {
      setScheduleError(error.message || "Failed to fetch sholat schedule");
      setSchedulePayload(null);
    } finally {
      setIsFetchingSchedule(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchSholatSchedule();
  }, [user]);

  const handleLogout = () => {
    removeCookie("auth_token", { path: "/" });
    router.push("/login");
  };

  const todaySchedule = useMemo(() => getTodayData(schedulePayload?.jadwal || []), [schedulePayload]);

  return (
    <AppLayout
      user={user}
      onLogout={handleLogout}
      isLoading={isLoading}
      loadingText="Loading dashboard..."
    >
      <main className="mx-auto h-[calc(100vh-56px)] w-full max-w-[1600px] p-2">
        <div className="grid h-full min-h-0 gap-2 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="min-h-0 overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526] p-3">
            <h1 className="font-[var(--font-heading)] text-xl text-[#f3f3f3]">Dashboard</h1>
            <p className="mt-1 text-sm text-[#9da1a6]">Welcome back, {user?.name || user?.email}.</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {quickCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link key={card.title} href={card.href} className="rounded-md border border-[#3c3c3c] bg-[#1f1f1f] p-3 transition-colors hover:bg-[#2d2d30]">
                    <div className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#3c3c3c] bg-[#252526] text-[#9cdcfe]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h2 className="mt-2 text-sm font-semibold text-[#e8e8e8]">{card.title}</h2>
                    <p className="text-xs text-[#9da1a6]">{card.subtitle}</p>
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 rounded-md border border-[#3c3c3c] bg-[#1f1f1f] p-3">
              <div className="flex items-center gap-2 text-[#9cdcfe]">
                <CalendarClock className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-[#e8e8e8]">Today's Sholat</h3>
              </div>

              {todaySchedule ? (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {["subuh", "dzuhur", "ashar", "maghrib", "isya"].map((key) => (
                    <div key={key} className="rounded border border-[#3c3c3c] bg-[#252526] px-2 py-1.5">
                      <p className="uppercase text-[#8f9397]">{key}</p>
                      <p className="mt-0.5 text-sm font-semibold text-[#e8e8e8]">{todaySchedule[key]}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#9da1a6]">No schedule loaded for today.</p>
              )}
            </div>
          </section>

          <section className="min-h-0 overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
            <div className="flex flex-wrap items-end gap-2 border-b border-[#3c3c3c] px-3 py-2">
              <div className="w-full sm:w-auto">
                <label className="mb-1 block text-xs text-[#9da1a6]">Provinsi</label>
                <input
                  value={provinsi}
                  onChange={(e) => setProvinsi(e.target.value)}
                  className="h-8 w-full rounded-md border border-[#3c3c3c] bg-[#1f1f1f] px-2.5 text-sm text-[#d4d4d4] outline-none focus:ring-2 focus:ring-[#007acc]/60 sm:w-40"
                />
              </div>
              <div className="w-full sm:w-auto">
                <label className="mb-1 block text-xs text-[#9da1a6]">Kota / Kabupaten</label>
                <input
                  value={kabkota}
                  onChange={(e) => setKabkota(e.target.value)}
                  className="h-8 w-full rounded-md border border-[#3c3c3c] bg-[#1f1f1f] px-2.5 text-sm text-[#d4d4d4] outline-none focus:ring-2 focus:ring-[#007acc]/60 sm:w-40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9da1a6]">Month</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value)}
                  className="h-8 w-20 rounded-md border border-[#3c3c3c] bg-[#1f1f1f] px-2.5 text-sm text-[#d4d4d4] outline-none focus:ring-2 focus:ring-[#007acc]/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9da1a6]">Year</label>
                <input
                  type="number"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="h-8 w-24 rounded-md border border-[#3c3c3c] bg-[#1f1f1f] px-2.5 text-sm text-[#d4d4d4] outline-none focus:ring-2 focus:ring-[#007acc]/60"
                />
              </div>

              <Button
                type="button"
                onClick={fetchSholatSchedule}
                disabled={isFetchingSchedule}
                className="h-8 gap-1.5 rounded-md bg-[#007acc] px-3 text-sm text-white hover:bg-[#0e639c]"
              >
                {isFetchingSchedule ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>

            <div className="h-[calc(100%-64px)] overflow-auto p-2">
              {scheduleError ? (
                <div className="rounded-md border border-[#5a1d1d] bg-[#3a1717] px-3 py-2 text-sm text-[#f48771]">{scheduleError}</div>
              ) : !schedulePayload ? (
                <div className="flex h-full items-center justify-center text-sm text-[#9da1a6]">No schedule loaded.</div>
              ) : (
                <table className="w-full table-fixed border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#252526]">
                    <tr className="border-b border-[#3c3c3c] text-xs uppercase tracking-[0.1em] text-[#9da1a6]">
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-left">Subuh</th>
                      <th className="px-2 py-2 text-left">Dzuhur</th>
                      <th className="px-2 py-2 text-left">Ashar</th>
                      <th className="px-2 py-2 text-left">Maghrib</th>
                      <th className="px-2 py-2 text-left">Isya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(schedulePayload.jadwal || []).map((item) => {
                      const isToday = item.tanggal_lengkap === new Date().toISOString().slice(0, 10);
                      return (
                        <tr key={item.tanggal_lengkap} className={`border-b border-[#303030] text-sm ${isToday ? "bg-[#0e3550]/45" : "hover:bg-[#2a2a2d]"}`}>
                          <td className="px-2 py-2 text-[#e8e8e8]">{item.hari}, {item.tanggal}</td>
                          <td className="px-2 py-2 text-[#c8c8c8]">{item.subuh}</td>
                          <td className="px-2 py-2 text-[#c8c8c8]">{item.dzuhur}</td>
                          <td className="px-2 py-2 text-[#c8c8c8]">{item.ashar}</td>
                          <td className="px-2 py-2 text-[#c8c8c8]">{item.maghrib}</td>
                          <td className="px-2 py-2 text-[#c8c8c8]">{item.isya}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>
    </AppLayout>
  );
}
