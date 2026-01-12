# job-application-list Specification

## Purpose

Defines the behavior of the job application list view in the applications page.

## ADDED Requirements

### Requirement: Flat Application List

The job applications list MUST display as a flat list without expandable/collapsible items or nested logs.

#### Scenario: Application list renders without expand controls

- **WHEN** a user views the job applications page
- **THEN** applications should display as a flat list
- **AND** there should be no expand/collapse arrows or buttons
- **AND** logs should NOT be displayed inline with the list

#### Scenario: Clicking an application shows details with logs

- **WHEN** a user clicks on a job application in the list
- **THEN** the application should be selected
- **AND** the application's logs should be loaded automatically
- **AND** the detail panel should show both application details and the log list

### Requirement: Combined Detail and Logs View

The detail panel MUST display both application details and its logs when an application is selected.

#### Scenario: Detail panel shows application info with logs

- **WHEN** a user selects a job application
- **THEN** the detail panel should show application details (company, title, status, salary, notes)
- **AND** a log list should appear below the application details
- **AND** the user should be able to add new logs directly from this view

#### Scenario: Log interactions work in combined view

- **WHEN** a user adds a new log from the detail panel
- **THEN** the log should appear in the log list
- **AND** auto-save should work for log edits (1s delay)
