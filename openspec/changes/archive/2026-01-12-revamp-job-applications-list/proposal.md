# Revamp Job Applications List

## Summary

This change revamps the job applications page by replacing the current expandable tree view (with dropdowns) with a flat application list. When a user clicks on an application, the detail panel will display both the application details and its logs in a unified view.

## Current Behavior

- The `TreeView` component displays applications as expandable items
- Users must click an expand arrow to reveal nested logs underneath each application
- The `DetailPanel` shows either application details OR log details separately
- Users need to click a separate "View Logs" button to see logs in a dedicated view

## Proposed Behavior

- The left panel will show a flat list of applications (no expand arrows, no nested items)
- Clicking an application will:
  1. Select the application
  2. Automatically load its logs
  3. Show both application details AND its log list in the right detail panel
- The detail panel will have two sections:
  - Top: Application details (company, title, status, notes, etc.)
  - Bottom: Log list (using the existing `JobLogList` component)

## Affected Components

| File                                  | Change Type                                                  |
| ------------------------------------- | ------------------------------------------------------------ |
| `components/dashboard/TreeView.js`    | Modify - Remove expand/collapse logic, simplify to flat list |
| `components/dashboard/DetailPanel.js` | Modify - Add logs section below application details          |
| `pages/applications.js`               | Modify - Simplify state, auto-load logs on selection         |
