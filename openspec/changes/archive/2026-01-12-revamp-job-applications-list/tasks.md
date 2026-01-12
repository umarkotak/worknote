# Tasks for revamp-job-applications-list

## Implementation Order

1. [x] **Simplify TreeView to flat list**

   - Remove `TreeItem` expand/collapse functionality
   - Remove nested logs rendering from `TreeView`
   - Keep application item click to select the application
   - Verification: Visual inspection - no expand arrows, no nested items

2. [x] **Update DetailPanel to show logs below details**

   - Import `JobLogList` component
   - Add logs section below `ApplicationDetail` when an application is selected
   - Pass logs and CRUD handlers as props
   - Verification: Click an application, see details + logs in right panel

3. [x] **Update applications.js state management**

   - Auto-load logs when an application is selected
   - Remove separate "View Logs" flow (showForm === "logs" state)
   - Pass log-related props to `DetailPanel`
   - Verification: Logs load automatically on application click

4. [x] **Clean up unused code**
   - Remove `onViewLogs` button and handler from `DetailPanel`
   - Remove logs-only view mode from applications.js
   - Verification: No runtime errors, clean console

## Additional Enhancements

5. [x] **Show create date and days elapsed on application list**

   - Added date display with days elapsed (e.g., "Jan 12 (5d)")
   - Sorted applications by most recent first

6. [x] **Format salary with comma separator**

   - Added formatSalary function for comma-separated numbers
   - Handles salary ranges (e.g., "$100,000 - $150,000")

7. [x] **Enable log editing/updating**
   - Already supported via JobLogList's debounced auto-save (1s delay)

## Validation

- Click any application → Details + logs appear in detail panel
- Add a new log from detail panel → Log appears in list
- Edit a log → Auto-saves after 1s delay
- No dropdown arrows visible in application list
- Applications sorted by most recent first
- Date and days elapsed shown on each application
