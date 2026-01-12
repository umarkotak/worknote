import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusColors = {
  todo: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
  applied: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  "in-progress": "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  rejected: "bg-red-500/20 text-red-600 dark:text-red-400",
  accepted: "bg-green-500/20 text-green-600 dark:text-green-400",
  dropped: "bg-muted text-muted-foreground",
};

const stateOptions = [
  { value: "", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "applied", label: "Applied" },
  { value: "in-progress", label: "In Progress" },
  { value: "rejected", label: "Rejected" },
  { value: "accepted", label: "Accepted" },
  { value: "dropped", label: "Dropped" },
];

// Calculate days elapsed since a date
function getDaysElapsed(dateStr) {
  if (!dateStr) return 0;
  const created = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Format date as short string
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ApplicationItem({ item, isSelected, onSelect }) {
  const daysElapsed = getDaysElapsed(item.created_at);

  return (
    <div
      className={cn(
        "flex flex-col gap-1 px-3 py-2 cursor-pointer rounded-md transition-colors",
        "hover:bg-muted/80",
        isSelected && "bg-primary/10 text-primary"
      )}
      onClick={() => onSelect(item)}
    >
      {/* Top row: Company name and status */}
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm truncate font-medium">{item.company_name}</span>
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0", statusColors[item.state] || statusColors.todo)}>
          {item.state}
        </span>
      </div>
      {/* Bottom row: Job title and date info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex-1 truncate">{item.job_title}</span>
        <span className="shrink-0">
          {formatDate(item.created_at)} ({daysElapsed}d)
        </span>
      </div>
    </div>
  );
}

export default function TreeView({
  applications = [],
  selectedItem,
  onSelect,
  onAddNew,
  searchQuery,
  onSearchChange,
  filterState,
  onFilterChange,
}) {
  // Sort applications by created_at descending (most recent first)
  const sortedApplications = [...applications].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return dateB - dateA;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Job Applications
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onAddNew}
          title="Add New Application"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="px-2 py-2 space-y-2 border-b border-border">
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-7 text-sm"
        />
        <select
          value={filterState}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full h-7 text-sm rounded-md border border-input bg-background px-2"
        >
          {stateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Application List */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {sortedApplications.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No applications found
          </div>
        ) : (
          sortedApplications.map((app) => (
            <ApplicationItem
              key={app.id}
              item={app}
              isSelected={selectedItem?.id === app.id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
