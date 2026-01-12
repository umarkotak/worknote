import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import JobLogList from "./JobLogList";

const statusColors = {
  todo: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
  applied: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  "in-progress": "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  rejected: "bg-red-500/20 text-red-600 dark:text-red-400",
  accepted: "bg-green-500/20 text-green-600 dark:text-green-400",
  dropped: "bg-muted text-muted-foreground",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format salary with comma separators
function formatSalary(salaryStr) {
  if (!salaryStr) return "";
  // Handle range format like "100000-150000" or "100000 - 150000"
  const parts = salaryStr.split(/\s*[-–]\s*/);
  const formatted = parts.map(part => {
    // Extract numbers and format them
    const num = part.replace(/[^0-9]/g, "");
    if (num) {
      const formatted = parseInt(num, 10).toLocaleString("en-US");
      // Preserve any prefix like $ or currency
      const prefix = part.match(/^[^0-9]*/)?.[0] || "";
      const suffix = part.match(/[^0-9]*$/)?.[0] || "";
      return prefix + formatted + suffix;
    }
    return part;
  });
  return formatted.join(" - ");
}

function ApplicationDetail({ item, onEdit, onDelete }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{item.company_name}</h3>
          <p className="text-sm text-muted-foreground">{item.job_title}</p>
        </div>
        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", statusColors[item.state] || statusColors.todo)}>
          {item.state}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {item.job_url && (
          <div>
            <span className="text-muted-foreground">URL:</span>{" "}
            <a href={item.job_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
              {item.job_url}
            </a>
          </div>
        )}
        {item.salary_range && (
          <div>
            <span className="text-muted-foreground">Salary:</span> {formatSalary(item.salary_range)}
          </div>
        )}
        {item.email && (
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            <a href={`mailto:${item.email}`} className="text-primary hover:underline">
              {item.email}
            </a>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Created:</span> {formatDate(item.created_at)}
        </div>
      </div>

      {item.notes && (
        <div>
          <span className="text-sm text-muted-foreground">Notes:</span>
          <p className="text-sm mt-1 whitespace-pre-wrap bg-muted/50 rounded-md p-2">{item.notes}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

export default function DetailPanel({
  selectedApplication,
  logs = [],
  onEdit,
  onDelete,
  onAddLog,
  onUpdateLog,
  isLoading = false,
}) {
  if (!selectedApplication) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Select an application to view details
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Application Details - Fixed top section */}
      <div className="shrink-0 p-4 border-b border-border">
        <ApplicationDetail
          item={selectedApplication}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* Log List - Scrollable section */}
      <div className="flex-1 min-h-0">
        <JobLogList
          logs={logs}
          applicationId={selectedApplication.id}
          onAddLog={onAddLog}
          onUpdateLog={onUpdateLog}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
