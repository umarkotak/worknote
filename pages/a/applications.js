import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

import { useDashboardSession } from "@/components/session/DashboardSessionProvider";
import api from "@/lib/api";
import TreeView from "@/components/dashboard/TreeView";
import DetailPanel from "@/components/dashboard/DetailPanel";
import JobApplicationForm from "@/components/dashboard/JobApplicationForm";

export default function ApplicationsPage() {
  const { user } = useDashboardSession();

  const [applications, setApplications] = useState([]);
  const [applicationLogs, setApplicationLogs] = useState({});
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadApplications = useCallback(async () => {
    const { data, error } = await api.listJobApplications({
      search: searchQuery,
      state: filterState,
    });

    if (error) {
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

  const loadLogsForApplication = async (applicationId) => {
    const { data, error } = await api.listJobApplicationLogs(applicationId);

    if (error) {
      if (error.status === 404) {
        setApplicationLogs((prev) => ({
          ...prev,
          [applicationId]: [],
        }));
        return;
      }

      toast.error("Failed to load logs");
      return;
    }

    setApplicationLogs((prev) => ({
      ...prev,
      [applicationId]: data.data || [],
    }));
  };

  const handleSelectApplication = (application) => {
    setSelectedApplication(application);
    setShowForm(false);

    if (application && !applicationLogs[application.id]) {
      loadLogsForApplication(application.id);
    }
  };

  const handleSaveApplication = async (formData) => {
    setIsSaving(true);
    const isEditing = !!editingItem;

    if (isEditing) {
      const { error } = await api.updateJobApplication(editingItem.id, formData);
      if (error) {
        toast.error(error.message || "Failed to update application");
        setIsSaving(false);
        return;
      }
      toast.success("Application updated");
    } else {
      const { error } = await api.createJobApplication(formData);
      if (error) {
        toast.error(error.message || "Failed to create application");
        setIsSaving(false);
        return;
      }
      toast.success("Application created");
    }

    await loadApplications();
    setShowForm(false);
    setEditingItem(null);

    if (!isEditing) {
      setSelectedApplication(null);
    } else {
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
      toast.error(error.message || "Failed to delete application");
      return;
    }

    await loadApplications();
    setSelectedApplication(null);
    toast.success("Application deleted");
  };

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

  const currentLogs = selectedApplication ? applicationLogs[selectedApplication.id] || [] : [];

  return (
    <main className="mx-auto flex h-[calc(100vh-56px)] w-full max-w-[1600px] min-h-0 p-2">
        <div className="flex min-h-0 w-full overflow-hidden rounded-lg border border-[#3c3c3c] bg-[#252526]">
          <div className="w-[360px] border-r border-[#3c3c3c] bg-[#1f1f1f] min-h-0">
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

          <div className="min-w-0 flex-1 bg-[#252526]">
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
      </main>
  );
}
