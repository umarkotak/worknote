# Tasks: Add Monthly Work Log Summary

## 1. API Integration

- [x] 1.1 Add `generateWorkLogSummary(month)` method to `lib/api.js`
- [x] 1.2 Add `getWorkLogSummary(month)` method to `lib/api.js`

## 2. UI Components

- [x] 2.1 Add "Summary" button to month header in `WorkLogPanel.js`
- [x] 2.2 Create `WorkLogSummaryPanel.js` component for displaying summary in side panel
- [x] 2.3 Update `WorkLogPanel.js` to support selection state and emit selected month

## 3. Page Layout

- [x] 3.1 Update `worklogs.js` page to use split-panel layout (list + detail)
- [x] 3.2 Add state management for selected month and summary data
- [x] 3.3 Implement loading and error states for summary generation

## 4. Interaction Flow

- [x] 4.1 Clicking month header or its work logs → select that month → show summary in detail panel
- [x] 4.2 Clicking "Summary" button → generate summary via API → display in panel
- [x] 4.3 Handle case when summary already exists (fetch vs regenerate)

## 5. Styling

- [x] 5.1 Style the detail panel to match Slack-style thread view aesthetic
- [x] 5.2 Add responsive behavior for the split-panel layout
