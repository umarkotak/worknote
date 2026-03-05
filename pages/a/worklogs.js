import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";

import api from "@/lib/api";
import AppLayout from "@/components/layouts/AppLayout";
import WorkLogPanel from "@/components/dashboard/WorkLogPanel";
import WorkLogSummaryPanel from "@/components/dashboard/WorkLogSummaryPanel";

export default function WorkLogsPage() {
  const router = useRouter();
  const [cookies, , removeCookie] = useCookies(["auth_token"]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [workLogs, setWorkLogs] = useState([]);
  const [isSaving] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

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
  }, [router, cookies.auth_token, removeCookie]);

  useEffect(() => {
    if (!user) return;

    const loadWorkLogs = async () => {
      const { data, error } = await api.listWorkLogs();
      if (error) {
        toast.error("Failed to load work logs");
        return;
      }
      setWorkLogs(data.data || []);
    };

    loadWorkLogs();
  }, [user]);

  const handleSaveWorkLog = async (logData) => {
    const { error } = await api.upsertWorkLog(logData);
    if (error) {
      toast.error(error.message || "Failed to save work log");
      return;
    }

    const { data } = await api.listWorkLogs();
    setWorkLogs(data?.data || []);
  };

  const handleMonthSelect = async (month) => {
    if (selectedMonth === month) {
      return;
    }

    setSelectedMonth(month);
    setSummaryError(null);
    setIsLoadingSummary(true);

    const { data, error } = await api.getWorkLogSummary(month);
    setIsLoadingSummary(false);

    if (error) {
      if (error.status === 404) {
        setSummaryData(null);
      } else {
        setSummaryError(error.message || "Failed to load summary");
      }
    } else {
      setSummaryData(data);
    }
  };

  const handleGenerateSummary = async (month) => {
    if (selectedMonth !== month) {
      setSelectedMonth(month);
    }

    setSummaryError(null);
    setIsLoadingSummary(true);

    const { data, error } = await api.generateWorkLogSummary(month);
    setIsLoadingSummary(false);

    if (error) {
      setSummaryError(error.message || "Failed to generate summary");
      toast.error(error.message || "Failed to generate summary");
    } else {
      setSummaryData(data);
      toast.success("Summary generated successfully");
    }
  };

  const handleCloseSummary = () => {
    setSelectedMonth(null);
    setSummaryData(null);
    setSummaryError(null);
  };

  const handleLogout = () => {
    removeCookie("auth_token", { path: "/" });
    router.push("/login");
  };

  return (
    <AppLayout
      user={user}
      onLogout={handleLogout}
      isLoading={isLoading}
      loadingText="Loading daily logs..."
    >
      <main className="mx-auto flex h-[calc(100vh-56px)] w-full max-w-[1600px] min-h-0 p-2">
        <div className="flex min-h-0 w-full overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
          <div className="min-w-0 flex-1">
            <WorkLogPanel
              workLogs={workLogs}
              onSave={handleSaveWorkLog}
              isLoading={isSaving}
              onMonthSelect={handleMonthSelect}
              selectedMonth={selectedMonth}
            />
          </div>

          {selectedMonth && (
            <WorkLogSummaryPanel
              selectedMonth={selectedMonth}
              summary={summaryData}
              isLoading={isLoadingSummary}
              error={summaryError}
              onGenerate={() => handleGenerateSummary(selectedMonth)}
              onClose={handleCloseSummary}
            />
          )}
        </div>
      </main>
    </AppLayout>
  );
}
