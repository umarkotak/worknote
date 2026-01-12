import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import api from "@/lib/api";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import TreeView from "@/components/dashboard/TreeView";
import DetailPanel from "@/components/dashboard/DetailPanel";
import JobApplicationForm from "@/components/dashboard/JobApplicationForm";

export default function ApplicationsPage() {
  const router = useRouter();
  const [cookies, , removeCookie] = useCookies(["auth_token"]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Job Applications state
  const [applications, setApplications] = useState([]);
  const [applicationLogs, setApplicationLogs] = useState({});
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

  // Load applications
  const loadApplications = useCallback(async () => {
    const { data, error } = await api.listJobApplications({
      search: searchQuery,
      state: filterState,
    });
    if (error) {
      console.error("Failed to load applications:", error);
      toast.error("Failed to load applications");
      return;
    }
    setApplications(data.data || []);
  }, [searchQuery, filterState]);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user, loadApplications]);

  // Load logs for an application
  const loadLogsForApplication = async (applicationId) => {
    const { data, error } = await api.listJobApplicationLogs(applicationId);
    if (error) {
      // 404 is expected for applications with no logs yet - just set empty array
      if (error.status === 404) {
        setApplicationLogs((prev) => ({
          ...prev,
          [applicationId]: [],
        }));
        return;
      }
      console.error("Failed to load logs:", error);
      toast.error("Failed to load logs");
      return;
    }
    setApplicationLogs((prev) => ({
      ...prev,
      [applicationId]: data.data || [],
    }));
  };

  // Selection handler - auto-load logs when selecting an application
  const handleSelectApplication = (application) => {
    setSelectedApplication(application);
    setShowForm(false);
    // Load logs for the selected application
    if (application && !applicationLogs[application.id]) {
      loadLogsForApplication(application.id);
    }
  };

  // Application CRUD
  const handleSaveApplication = async (formData) => {
    setIsSaving(true);
    const isEditing = !!editingItem;

    if (isEditing) {
      const { error } = await api.updateJobApplication(editingItem.id, formData);
      if (error) {
        console.error("Failed to update application:", error);
        toast.error(error.message || "Failed to update application");
        setIsSaving(false);
        return;
      }
      toast.success("Application updated");
    } else {
      const { error } = await api.createJobApplication(formData);
      if (error) {
        console.error("Failed to create application:", error);
        toast.error(error.message || "Failed to create application");
        setIsSaving(false);
        return;
      }
      toast.success("Application created");
    }

    await loadApplications();
    setShowForm(false);
    setEditingItem(null);

    // Only clear selection when creating new, keep selection when editing
    if (!isEditing) {
      setSelectedApplication(null);
    } else {
      // Refresh the selected application with updated data
      const { data } = await api.getJobApplication(selectedApplication.id);
      if (data) {
        setSelectedApplication(data);
      }
    }

    setIsSaving(false);
  };

  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;
    if (!confirm("Delete this application and all its logs?")) return;
    const { error } = await api.deleteJobApplication(selectedApplication.id);
    if (error) {
      console.error("Failed to delete:", error);
      toast.error(error.message || "Failed to delete application");
      return;
    }
    await loadApplications();
    setSelectedApplication(null);
    toast.success("Application deleted");
  };

  // Log CRUD
  const handleAddLog = async (logData) => {
    if (!selectedApplication) return;
    const { error } = await api.createJobApplicationLog(selectedApplication.id, logData);
    if (error) {
      toast.error(error.message || "Failed to add log");
      return;
    }
    await loadLogsForApplication(selectedApplication.id);
  };

  const handleUpdateLog = async (logId, logData) => {
    if (!selectedApplication) return;
    const { error } = await api.updateJobApplicationLog(selectedApplication.id, logId, logData);
    if (error) {
      toast.error(error.message || "Failed to update log");
      return;
    }
    await loadLogsForApplication(selectedApplication.id);
  };

  // Logout
  const handleLogout = () => {
    removeCookie("auth_token", { path: "/" });
    router.push("/login");
  };

  // Get logs for the currently selected application
  const currentLogs = selectedApplication
    ? applicationLogs[selectedApplication.id] || []
    : [];

  return (
    <DashboardLayout
      user={user}
      onLogout={handleLogout}
      activeSection="applications"
      isLoading={isLoading}
    >
      <div className="flex-1 flex min-h-0">
        {/* Left: Application List or Form */}
        <div className="w-80 border-r border-border flex flex-col min-h-0">
          {showForm ? (
            <JobApplicationForm
              application={editingItem}
              onSave={handleSaveApplication}
              onCancel={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
              isLoading={isSaving}
            />
          ) : (
            <TreeView
              applications={applications}
              selectedItem={selectedApplication}
              onSelect={handleSelectApplication}
              onAddNew={() => {
                setShowForm(true);
                setEditingItem(null);
              }}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterState={filterState}
              onFilterChange={setFilterState}
            />
          )}
        </div>

        {/* Right: Detail Panel with Logs */}
        <div className="flex-1 min-w-0">
          <DetailPanel
            selectedApplication={selectedApplication}
            logs={currentLogs}
            onEdit={() => {
              setEditingItem(selectedApplication);
              setShowForm(true);
            }}
            onDelete={handleDeleteApplication}
            onAddLog={handleAddLog}
            onUpdateLog={handleUpdateLog}
            isLoading={isSaving}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
