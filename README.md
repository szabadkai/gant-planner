Gantt Queue Planner
====================

Lightweight, dependency-free web app to create a simple Gantt chart by dragging tasks (with a manday duration) into a staff member’s queue. Tasks auto-schedule sequentially per staff, starting from a chosen project start date.

Quick Start
-----------

1. Open `index.html` in your browser.
2. Use the left sidebar to add tasks and staff.
3. Drag tasks from Backlog onto a staff row to queue and schedule them.

Features
--------

- Drag-and-drop tasks from Backlog into staff rows.
- Auto-queue: dropped tasks are appended and scheduled after existing ones.
- Mandays: block width equals the `mandays` duration (1 unit = 1 working day).
- Start Date control with optional “Skip weekends”.
- Zoom slider to adjust the cell width (timeline density).
- Click an assigned task to return it to Backlog.
- Remove staff (their queued tasks return to Backlog).
- LocalStorage persistence (your plan stays after refresh).
- Import tasks from CSV with optional staff assignment.

Concepts & Assumptions
----------------------

- One task consumes one full working day per manday, per staff member.
- Each staff member has capacity 1 task/day; tasks queue sequentially.
- Weekend skipping: when enabled, the header labels and day units skip Sat/Sun.
- The chart auto-extends to fit the longest staff queue (minimum 30 days).

Tips
----

- Double-click a backlog task to delete it entirely.
- Use the Zoom slider to fit more or fewer days on screen.
- Use the Clear All button to reset the plan (keeps current zoom and date input value).

Limitations (by design for simplicity)
--------------------------------------

- No partial days; durations are whole days.
- No overlap or parallelism per staff (strict FIFO queue).
- No dependencies between tasks.
- No export yet (you can print or take a screenshot).

Project Structure
-----------------

- `index.html` – UI layout and controls
- `styles.css` – Styling and Gantt visualization
- `app.js` – State, persistence, drag-and-drop, scheduling, rendering

License
-------

This project is provided as-is without warranty. You can adapt it freely within your environment.

CSV Import
----------

Use the “Import CSV” button in the Backlog panel. CSV supports a header row with the following columns (case-insensitive):

- `name` (required)
- `mandays` (required, whole number)
- `staff` (optional)

Examples:

With header (recommended):

name,mandays,staff
Setup,2,Alice
Design,3,
API,4,Bob

Without header (first 2–3 columns are used):

Setup,2,Alice
Design,3
API,4,Bob

Behavior:
- Missing or invalid rows are skipped.
- If `staff` is provided and doesn’t exist yet, a staff member is created automatically and the task is queued to them.
- Otherwise, tasks are added to the Backlog.

Sample CSV
----------

- A ready-made file is included: `sample.csv` (also downloadable via the app next to the Import button).

Contents:

name,mandays,staff
Discovery,2,Alice
Design,3,Alice
API Development,5,Bob
Frontend,5,Carol
QA,3,
Deployment,2,
