# Style Guide for Gantt Chart SaaS App (Dark Mode First)

## 1. Brand & Identity
- **Overall Style**: Functional, data-dense, modern SaaS dashboard.  
- **Tone**: Efficient, technical, no-nonsense — designed for teams who manage tasks at scale.  
- **Primary Theme**: Dark mode by default, with optional light mode toggle later.  

## 2. Layout
- **Panels**:  
  - Left sidebar → project inputs (backlog, staff, themes).  
  - Right main area → Gantt timeline.  
  - Collapsible side panels recommended for more screen space.  
- **Navigation**:  
  - Top bar contains project switcher, zoom controls, sharing, login/logout.  
  - Minimal icons with text where clarity matters.  

## 3. Typography
- **Font**: Use *Inter* or *Roboto* for clarity in dense UIs.  
- **Sizes**:  
  - Top bar / panel titles: 16px, semibold.  
  - Body / labels: 14px, regular.  
  - Metadata (e.g., durations `5d`, `3d`): 12px, medium.  
- **Color**:  
  - Primary text: light gray `#E5E7EB`.  
  - Secondary labels: muted gray `#9CA3AF`.  
  - Avoid pure white to reduce eye strain.  

## 4. Color Palette
- **Backgrounds**:  
  - Main app: `#111827` (very dark gray).  
  - Panels: `#1F2937` (slightly lighter).  
- **Borders/Dividers**: `#374151`.  
- **Task Bars**:  
  - Blue (`#3B82F6`) — default tasks.  
  - Purple (`#8B5CF6`) — themes or grouped tasks.  
  - Pink/Red (`#EC4899`) — special/critical tasks.  
  - Hover/active → brighten by 10–15%.  
- **Highlight Colors**:  
  - Current day marker: `#F87171` (thin red line).  
- **Buttons**:  
  - Primary: Blue (`#2563EB`) with hover darker.  
  - Secondary: Gray outline with hover background.  
  - Destructive: Red background, white text.  

## 5. Components

### Task Bars (Gantt)
- Rounded corners (`6px`).  
- Compact height (≈ 28–32px).  
- Inner label: task name truncated with ellipsis, duration label aligned right.  
- Color indicates type or theme.  

### Sidebar Panels
- **Backlog / Staff / Themes**:  
  - Input fields: dark background with subtle border.  
  - Buttons: color-coded (green for auto-assign, blue for add, red for remove).  
  - List items: flush left, secondary text in muted gray.  

### Top Bar
- Dark, flat background.  
- Elements spaced evenly: project name dropdown, timeline controls, share button, user profile/logout.  

### Buttons
- **Primary**: Filled, bold label.  
- **Secondary**: Border only.  
- **Danger**: Red fill for destructive actions.  
- Rounded corners (`8px`).  

## 6. Iconography
- Use simple line icons (Lucide, Heroicons) in white/gray.  
- Sizes: 16–20px for sidebar, 20–24px for top bar.  
- Ensure consistent stroke width.  

## 7. Motion & Interaction
- **Transitions**:  
  - Panel open/close → slide in/out, 200ms ease-in-out.  
  - Hover on task bars → glow effect (slight shadow).  
- **Drag & Drop**:  
  - Ghost preview when moving tasks.  
  - Smooth snap to grid when dropping.  

## 8. Accessibility
- Dark mode contrast must be WCAG AA compliant (light text vs dark background).  
- Keyboard shortcuts (already present: zoom, skip weekends toggle).  
- Screen reader labels for task bars: announce task name, assignee, start–end dates.  
- Touch-friendly mode (larger bars & spacing) for tablets.  

## 9. Microcopy & Language
- **Direct labels**: “Add,” “Remove,” “Auto-Assign.”  
- **Task labels**: Truncate with ellipsis, full name in tooltip.  
- **Empty states**: Simple — e.g., “No tasks yet. Add one to get started.”  
