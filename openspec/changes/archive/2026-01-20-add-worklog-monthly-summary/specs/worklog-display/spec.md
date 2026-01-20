## ADDED Requirements

### Requirement: Month headers contain summary generation button

Each month header SHALL contain a "Summary" button that triggers AI-powered summary generation for that month's work logs.

#### Scenario: User clicks summary button to generate summary

- **GIVEN** the user is viewing the worklogs page
- **WHEN** the user clicks the "Summary" button on a month header
- **THEN** the system calls `POST /work-logs/summary` with the month in YYYY-MM format
- **AND** displays a loading indicator while generating
- **AND** shows the generated summary in the detail panel upon success

#### Scenario: Summary generation fails

- **GIVEN** the user clicks the summary button
- **WHEN** the API returns an error (e.g., no work logs found)
- **THEN** an error toast notification is displayed
- **AND** the detail panel shows an appropriate error message

---

### Requirement: Clicking month header or work logs shows monthly summary panel

The system SHALL display a detail panel on the right side when the user clicks on a month header or any work log entry within that month.

#### Scenario: User clicks on month header

- **GIVEN** the user is viewing the worklogs page
- **WHEN** the user clicks on a month header (e.g., "January 2026")
- **THEN** a detail panel appears on the right side of the screen
- **AND** the panel displays the monthly summary if one exists
- **AND** the panel shows a prompt to generate summary if none exists

#### Scenario: User clicks on a work log entry

- **GIVEN** the user is viewing the worklogs page
- **WHEN** the user clicks on a work log entry (not in edit mode)
- **THEN** the detail panel shows the summary for that entry's month
- **AND** the month is highlighted/selected in the main list

---

### Requirement: Monthly summary detail panel displays AI-generated content

The detail panel SHALL display the AI-generated monthly summary with proper formatting, similar to Slack's thread view.

#### Scenario: User views existing summary

- **GIVEN** a monthly summary exists for January 2026
- **WHEN** the user selects January 2026 in the worklogs view
- **THEN** the detail panel displays the summary content
- **AND** shows the creation/update timestamp
- **AND** provides an option to regenerate the summary

#### Scenario: No summary exists for selected month

- **GIVEN** no summary exists for the selected month
- **WHEN** the user views the detail panel
- **THEN** the panel displays a message indicating no summary exists
- **AND** shows a prominent button to generate a summary

---

## MODIFIED Requirements

### Requirement: Month headers contain action buttons

Each month header SHALL contain action buttons for quick actions.

#### Scenario: User views month header buttons

- **GIVEN** the user views the worklogs page
- **WHEN** a month header is visible
- **THEN** the header contains a collapse/expand toggle button
- **AND** the header contains a "Summary" button for generating monthly summaries
- **AND** the header contains a more options button for additional actions
