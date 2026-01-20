import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import api from "@/lib/api";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import WorkLogPanel from "@/components/dashboard/WorkLogPanel";
import WorkLogSummaryPanel from "@/components/dashboard/WorkLogSummaryPanel";

export default function WorkLogsPage() {
  const router = useRouter();
  const [cookies, , removeCookie] = useCookies(["auth_token"]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Work Logs state
  const [workLogs, setWorkLogs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Summary panel state
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      if (!cookies.auth_token) {
        router.push("/login");
        return;
      }
      const { data, error } = await api.getCurrentUser();
      if (error) {
        console.error("Auth error:", error);
        removeCookie("auth_token", { path: "/" });
        router.push("/login");
      } else {
        setUser(data);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Load work logs
  const loadWorkLogs = useCallback(async () => {
    const { data, error } = await api.listWorkLogs();
    if (error) {
      console.error("Failed to load work logs:", error);
      toast.error("Failed to load work logs");
      return;
    }
    setWorkLogs(data.data || []);
  }, []);

  useEffect(() => {
    if (user) {
      loadWorkLogs();
    }
  }, [user, loadWorkLogs]);

  // Load work log by date
  const loadWorkLogByDate = async (date) => {
    const { data, error } = await api.getWorkLogByDate(date);
    if (error) {
      // 404 is expected when no log exists for that date
      return null;
    }
    return data;
  };

  // Work log save
  const handleSaveWorkLog = async (logData) => {
    const { error } = await api.upsertWorkLog(logData);
    if (error) {
      console.error("Failed to save work log:", error);
      toast.error(error.message || "Failed to save work log");
      return;
    }
    await loadWorkLogs();
  };

  // Work log delete
  const handleDeleteWorkLog = async (date) => {
    const { error } = await api.deleteWorkLog(date);
    if (error) {
      console.error("Failed to delete work log:", error);
      throw new Error(error.message || "Failed to delete work log");
    }
    await loadWorkLogs();
  };

  // Handle month selection - fetch existing summary
  const handleMonthSelect = async (month) => {
    setSelectedMonth(month);
    setSummaryError(null);
    setIsLoadingSummary(true);

    const { data, error } = await api.getWorkLogSummary(month);
    setIsLoadingSummary(false);

    if (error) {
      if (error.status === 404) {
        // No summary exists yet, that's fine
        setSummaryData(null);
      } else {
        setSummaryError(error.message || "Failed to load summary");
      }
    } else {
      setSummaryData(data);
    }
  };

  // Handle summary generation
  const handleGenerateSummary = async (month) => {
    // First select the month to show panel
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

  // Close summary panel
  const handleCloseSummary = () => {
    setSelectedMonth(null);
    setSummaryData(null);
    setSummaryError(null);
  };

  // Logout
  const handleLogout = () => {
    removeCookie("auth_token", { path: "/" });
    router.push("/login");
  };

  return (
    <DashboardLayout
      user={user}
      onLogout={handleLogout}
      activeSection="worklogs"
      isLoading={isLoading}
    >
      <div className="flex flex-1 min-h-0">
        {/* Main Work Log Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <WorkLogPanel
            workLogs={workLogs}
            onSave={handleSaveWorkLog}
            onDelete={handleDeleteWorkLog}
            onLoadLog={loadWorkLogByDate}
            isLoading={isSaving}
            onMonthSelect={handleMonthSelect}
            onGenerateSummary={handleGenerateSummary}
            selectedMonth={selectedMonth}
          />
        </div>

        {/* Summary Panel - conditionally rendered */}
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
    </DashboardLayout>
  );
}
