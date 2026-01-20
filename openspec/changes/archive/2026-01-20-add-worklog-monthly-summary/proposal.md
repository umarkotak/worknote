# Change: Add Monthly Work Log Summary Feature

## Why

Users need a way to see AI-generated summaries of their monthly work activities. Currently, work logs are displayed individually without any aggregated view or insights. A monthly summary provides value by distilling the month's activities into actionable insights.

## What Changes

- Add a "Summary" button to the month section header in the WorkLogPanel component
- Implement a detail/side panel that appears when clicking on month header or any work log entry (Slack-style thread view)
- Integrate with backend API for generating and retrieving monthly summaries:
  - `POST /work-logs/summary` - Generate AI summary for a month
  - `GET /work-logs/summary/:month` - Retrieve existing summary
- Add API client methods for summary endpoints
- Update layout to support split-panel view (main list + detail panel)

## Impact

- Affected specs: `worklog-display`
- Affected code:
  - `components/dashboard/WorkLogPanel.js` - Add summary button and detail panel support
  - `pages/worklogs.js` - Handle state for selected month/summary
  - `lib/api.js` - Add summary API methods
