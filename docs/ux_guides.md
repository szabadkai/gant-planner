# UX & UI Guidelines for SaaS Gantt Chart Application

## 1. Core Principles

- **Clarity first**: Users should immediately understand what tasks, dates, and dependencies mean.
- **Minimalism**: Keep the interface clean; every visible element must serve a purpose.
- **Consistency**: Use consistent colors, typography, and iconography across the app.
- **Responsiveness**: Must work well on desktops (primary), with simplified read-only views for tablets/mobile.
- **Performance**: Rendering of the Gantt chart must remain smooth even with large datasets.

## 2. Layout & Structure

- **Main workspace**:
    - Left panel: Task list (hierarchical, collapsible).
    - Right panel: Timeline (scrollable horizontally).
- **Top bar**: Global navigation, project title, search, filters, user profile/settings.
- **Contextual panel/drawer**: Opens on the right for task details or editing.

## 3. Task List (Left Panel)

- **Indentation for hierarchy**: Parent > Subtask.
- **Controls**: Checkbox or status indicator, task name, assignee avatar, due date.
- **Quick add**: Inline “+ Add Task” row at the bottom.
- **Interactions**:
    - Click task name → open detail drawer.
    - Drag to reorder tasks.
    - Collapse/expand groups.

## 4. Gantt Timeline (Right Panel)

- **Grid structure**:
    - Vertical axis: tasks.
    - Horizontal axis: time scale (day, week, month).
- **Task bars**:
    - Colored rectangles spanning start → end dates.
    - Show progress (% filled bar or lighter/darker section).
    - Resizable via drag handles.
- **Dependencies**:
    - Arrow lines between tasks.
    - Hover highlights connected tasks.
- **Zoom levels**: Toggle between daily, weekly, and monthly views.
- **Current date line**: Vertical highlight for “today.”

## 5. Color & Visual Design

- **Palette**: Neutral background, accent colors for task states.
    - Default task: light blue.
    - In-progress: darker blue.
    - Completed: gray/green.
    - Overdue: red.
- **Dependencies**: subtle gray lines; active/hover state boldens.
- **Accessibility**: Ensure WCAG AA contrast compliance.

## 6. Interactions & Micro UX

- **Hover states**: Show tooltips with task name, duration, assignee.
- **Right-click / long-press menu**: Edit, delete, duplicate, add dependency.
- **Drag & drop**:
    - Move bar to reschedule.
    - Resize bar to adjust duration.
    - Drag from edge to link tasks (dependency).
- **Undo/redo**: Support quick correction.

## 7. Task Detail Drawer

- **Contents**:
    - Title (editable inline).
    - Assignee (dropdown with avatars).
    - Start & end dates.
    - Progress (% or checkbox).
    - Notes/comments.
    - File attachments.
- **Behavior**: Opens over timeline, closable with Esc or click outside.

## 8. Navigation & Controls

- **Top bar items**:
    - Project switcher (dropdown).
    - Filters (by assignee, status).
    - Search (by task name).
- **Keyboard shortcuts**:
    - `N` → new task.
    - `Del` → delete selected task.
    - Arrow keys → navigate tasks.
- **Mobile adaptation**:
    - Collapse task list by default.
    - Provide read-only timeline with simple tap to view task.

## 9. Feedback & States

- **Loading state**: Skeleton UI for chart and task list.
- **Empty state**: Friendly illustration + “Add your first task.”
- **Error state**: Clear inline message with retry action.
- **Save state**: Auto-save with subtle “All changes saved” indicator.

## 10. Accessibility

- Full keyboard navigation: arrows to move focus, enter to select.
- Screen reader support: each task bar should announce task name, start, end, and status.
- Color-blind safe palette and dependency line patterns (dashed vs solid).

## 11. Branding & Typography

- **Typography**: Sans-serif, 14px–16px body, 12px secondary labels, 18px section headers.
- **Logo placement**: Top left corner.
- **Tone**: Professional but approachable—avoid clutter and unnecessary decorative elements.

## 12. Performance Considerations

- Virtual scrolling for large task lists.
- Lazy-loading dependencies.
- Efficient DOM rendering for smooth dragging.

## 13. Mobile UX Guidelines

- **Default View**:
    - Prioritize **read-only timeline** with scrolling and zoom.
    - Show simplified task list (collapsed by default).
- **Navigation**:
    - Bottom navigation bar for quick access: Tasks, Timeline, Filters, Profile.
    - Swipe gestures: left/right to switch between task list and timeline.
- **Task Interaction**:
    - Tap a task bar → open detail view in a modal sheet.
    - Quick actions (mark complete, reassign) available via long-press menu.
- **Timeline Interaction**:
    - Pinch to zoom (day/week/month).
    - Horizontal drag to scroll through time.
    - Today’s marker always visible.
- **Editing**:
    - Limited inline editing to avoid precision issues.
    - Encourage edits through task detail modal rather than dragging bars.
- **Performance**:
    - Load fewer tasks per screen; use virtual scrolling.
    - Simplify dependency rendering (highlight only on tap).
- **Accessibility on Mobile**:
    - Large touch targets (min. 44x44 px).
    - VoiceOver / TalkBack support: announce task name, date range, and status.
    - High-contrast mode supported.
