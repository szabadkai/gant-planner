// Simple Gantt Queue Planner

// --- Persistence helpers ---
const STORAGE_KEY = "gantt_queue_planner_state_v1";

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load state:", e);
    return null;
  }
}

// --- Utilities ---
const byId = (id) => document.getElementById(id);
const todayISO = () => new Date().toISOString().slice(0, 10);

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isWeekend(d) {
  const n = d.getDay();
  return n === 0 || n === 6; // Sun, Sat
}

function formatShort(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

// Deterministic color from a string (for themes)
function themeHue(str) {
  if (!str) return null;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0; // keep 32-bit
  }
  h = h % 360;
  if (h < 0) h += 360;
  return h;
}

function applyThemeToBlock(el, theme) {
  if (!theme) return;
  const h = themeHue(theme);
  if (h == null) return;
  el.style.background = `linear-gradient(135deg, hsla(${h}, 70%, 60%, 0.28), hsla(${(h + 20) % 360}, 70%, 50%, 0.28))`;
  el.style.borderColor = `hsl(${h}, 60%, 45%)`;
}

function applyThemeToCard(el, theme) {
  if (!theme) return;
  const h = themeHue(theme);
  if (h == null) return;
  el.style.background = `hsla(${h}, 70%, 40%, 0.20)`;
  el.style.borderColor = `hsl(${h}, 60%, 35%)`;
}

// Build an array of Date objects for N working/continuous days starting at startDate
function buildDateAxis(startISO, count, skipWeekends) {
  const res = [];
  let i = 0;
  let cursor = new Date(startISO);
  while (res.length < count) {
    if (!skipWeekends || !isWeekend(cursor)) {
      res.push(new Date(cursor));
    }
    // Move cursor one calendar day always
    cursor = addDays(cursor, 1);
    i++;
    if (i > 10000) break; // safety
  }
  return res;
}

// --- State ---
const defaultState = {
  startDate: todayISO(),
  skipWeekends: true,
  tasks: [], // [{id, name, mandays}]
  backlog: [], // [taskId]
  staff: [], // [{id, name, queue: [taskId]}]
  zoom: 32,
};

let state = Object.assign({}, defaultState, loadState() || {});

// --- DOM elements ---
const el = {
  startDate: byId("startDate"),
  skipWeekends: byId("skipWeekends"),
  zoom: byId("zoom"),
  backlog: byId("backlog"),
  staffName: byId("staffName"),
  addStaffBtn: byId("addStaffBtn"),
  staffList: byId("staffList"),
  taskName: byId("taskName"),
  taskDays: byId("taskDays"),
  taskTheme: byId("taskTheme"),
  addTaskBtn: byId("addTaskBtn"),
  importBtn: byId("importBtn"),
  importFile: byId("importFile"),
  clearAll: byId("clearAll"),
  ganttHeader: byId("ganttHeader"),
  ganttBody: byId("ganttBody"),
  themesPanel: byId("themesPanel"),
};

// Init inputs
el.startDate.value = state.startDate;
el.skipWeekends.checked = !!state.skipWeekends;
el.zoom.value = state.zoom || 32;
document.documentElement.style.setProperty("--cell-width", `${state.zoom || 32}px`);

// Measure and set header height variable for layout sizing
function updateLayoutVars() {
  const headerH = document.querySelector('.app-header')?.offsetHeight || 60;
  const footerH = document.querySelector('.footer')?.offsetHeight || 44;
  document.documentElement.style.setProperty('--app-header-height', headerH + 'px');
  document.documentElement.style.setProperty('--app-footer-height', footerH + 'px');
}
updateLayoutVars();
window.addEventListener('resize', updateLayoutVars);

// --- Actions ---
function addTask(name, mandays, jira, theme) {
  const t = { id: uid("task"), name: name.trim(), mandays: Math.max(1, Math.floor(mandays)) };
  if (jira && typeof jira === 'string' && jira.trim()) t.jira = jira.trim();
  if (theme && typeof theme === 'string' && theme.trim()) t.theme = theme.trim();
  state.tasks.push(t);
  state.backlog.unshift(t.id);
  saveState();
  renderAll();
}

function removeTaskCompletely(taskId) {
  // Remove from backlog and all queues
  state.backlog = state.backlog.filter((id) => id !== taskId);
  state.staff.forEach((s) => (s.queue = s.queue.filter((id) => id !== taskId)));
  state.tasks = state.tasks.filter((t) => t.id !== taskId);
  saveState();
  renderAll();
}

function addStaff(name) {
  const s = { id: uid("staff"), name: name.trim(), queue: [] };
  state.staff.push(s);
  saveState();
  renderAll();
}

function removeStaff(staffId) {
  // Return queued tasks to backlog
  const staff = state.staff.find((s) => s.id === staffId);
  if (staff) {
    state.backlog = [...staff.queue, ...state.backlog];
  }
  state.staff = state.staff.filter((s) => s.id !== staffId);
  saveState();
  renderAll();
}

function taskById(id) {
  return state.tasks.find((t) => t.id === id);
}

function enqueueTaskToStaff(taskId, staffId) {
  // If task is not yet in task list, ignore
  if (!taskById(taskId)) return;
  // Remove from backlog if present
  state.backlog = state.backlog.filter((id) => id !== taskId);
  // Remove from other staff queues if present
  state.staff.forEach((s) => (s.queue = s.queue.filter((id) => id !== taskId)));
  // Push to staff queue
  const staff = state.staff.find((s) => s.id === staffId);
  if (!staff) return;
  staff.queue.push(taskId);
  saveState();
  renderAll();
}

function returnTaskToBacklog(taskId) {
  // Remove from all queues
  state.staff.forEach((s) => (s.queue = s.queue.filter((id) => id !== taskId)));
  if (!state.backlog.includes(taskId)) state.backlog.unshift(taskId);
  saveState();
  renderAll();
}

// --- Scheduling and rendering ---
function computeHorizon() {
  // At least 30 days; extend to cover longest queue
  let maxDays = 0;
  for (const s of state.staff) {
    const sum = s.queue.reduce((acc, id) => acc + (taskById(id)?.mandays || 0), 0);
    if (sum > maxDays) maxDays = sum;
  }
  return Math.max(30, maxDays + 5);
}

function renderHeader(axis) {
  const frag = document.createDocumentFragment();
  // Left gutter for staff names
  const gutter = document.createElement("div");
  gutter.className = "gutter";
  frag.appendChild(gutter);
  // Day columns
  axis.forEach((d) => {
    const div = document.createElement("div");
    div.className = "col";
    div.textContent = formatShort(d);
    frag.appendChild(div);
  });
  el.ganttHeader.innerHTML = "";
  el.ganttHeader.appendChild(frag);
}

function renderBacklog() {
  el.backlog.innerHTML = "";
  state.backlog.forEach((id) => {
    const t = taskById(id);
    if (!t) return;
    const card = document.createElement("div");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.taskId = t.id;
    // Show full task name on hover
    card.title = `${t.name}`;
    card.innerHTML = `<span class="name">${escapeHTML(t.name)}</span>
      ${t.jira ? `<a class="jira" href="${escapeHTML(t.jira)}" target="_blank" rel="noopener noreferrer" title="Open Jira">↗</a>` : ''}
      <span class="days">${t.mandays}d</span>`;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", t.id);
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dblclick", () => removeTaskCompletely(t.id));
    // Theme coloring on backlog card
    applyThemeToCard(card, t.theme);
    // Prevent link click from triggering card actions
    card.querySelector('.jira')?.addEventListener('click', (e) => e.stopPropagation());

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'edit';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startEditTask(card, t);
    });
    card.appendChild(editBtn);
    el.backlog.appendChild(card);
  });

  // Allow dropping back tasks
  // Compute insertion index in backlog based on mouse Y position
  const computeBacklogIndex = (e) => {
    const rect = el.backlog.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const children = Array.from(el.backlog.querySelectorAll('.task-card'));
    for (let i = 0; i < children.length; i++) {
      const cr = children[i].getBoundingClientRect();
      const mid = (cr.top - rect.top) + cr.height / 2;
      if (y < mid) return i;
    }
    return children.length;
  };
  makeDroppable(el.backlog, (taskId, index) => returnTaskToBacklogAt(taskId, index), el.backlog, computeBacklogIndex);
}

// --- Edit Task (Backlog sidebar) ---
function startEditTask(card, t) {
  card.classList.add('editing');
  card.draggable = false;
  // Clear existing content
  card.innerHTML = '';

  const form = document.createElement('div');
  form.className = 'task-edit';

  const name = document.createElement('input');
  name.type = 'text';
  name.placeholder = 'Task name';
  name.value = t.name || '';

  const days = document.createElement('input');
  days.type = 'number';
  days.min = '1';
  days.value = String(t.mandays || 1);

  const theme = document.createElement('input');
  theme.type = 'text';
  theme.placeholder = 'Theme';
  theme.value = t.theme || '';

  const jira = document.createElement('input');
  jira.type = 'url';
  jira.placeholder = 'Jira URL';
  jira.value = t.jira || '';

  const actions = document.createElement('div');
  actions.className = 'task-edit-actions';

  const save = document.createElement('button');
  save.textContent = 'Save';
  save.addEventListener('click', (e) => {
    e.stopPropagation();
    const newName = name.value.trim();
    const newDays = Math.max(1, Math.floor(parseInt(days.value, 10) || 1));
    const newTheme = theme.value.trim();
    const newJira = jira.value.trim();
    if (!newName) { alert('Name is required'); return; }
    // Apply changes
    const task = taskById(t.id);
    if (!task) return;
    task.name = newName;
    task.mandays = newDays;
    task.theme = newTheme || undefined;
    task.jira = newJira || undefined;
    saveState();
    renderAll();
  });

  const cancel = document.createElement('button');
  cancel.className = 'secondary';
  cancel.textContent = 'Cancel';
  cancel.addEventListener('click', (e) => { e.stopPropagation(); renderAll(); });

  actions.appendChild(save);
  actions.appendChild(cancel);

  form.appendChild(name);
  form.appendChild(days);
  form.appendChild(theme);
  form.appendChild(jira);
  form.appendChild(actions);

  card.appendChild(form);
}

function renderStaffList() {
  el.staffList.innerHTML = "";
  state.staff.forEach((s) => {
    const row = document.createElement("div");
    row.className = "staff-item";
    row.innerHTML = `<span>${escapeHTML(s.name)}</span>`;
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeStaff(s.id));
    row.appendChild(removeBtn);
    el.staffList.appendChild(row);
  });
}

function renderGantt(axis) {
  el.ganttBody.innerHTML = "";
  const rowsWrapper = document.createElement("div");
  rowsWrapper.className = "gantt-rows";
  rowsWrapper.style.setProperty("--rows", state.staff.length);

  state.staff.forEach((s, rowIndex) => {
    const row = document.createElement("div");
    row.className = "gantt-row";
    row.dataset.staffId = s.id;

    // Grid cells
    const grid = document.createElement("div");
    grid.className = "grid";
    for (let i = 0; i < axis.length; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      grid.appendChild(cell);
    }

    // Label
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = s.name;

    // Drop handling on the whole row (so blocks remain clickable above)
    const dropzone = document.createElement("div");
    dropzone.className = "dropzone"; // visual only; no pointer events
    const computeRowIndex = (e) => {
      const tasksEl = tasksLayer;
      const rect = tasksEl.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const cellWidthStr = getComputedStyle(document.documentElement).getPropertyValue('--cell-width') || '32px';
      const cellWidth = parseFloat(cellWidthStr);
      const dropDay = Math.max(0, Math.round(x / (cellWidth || 32)));
      // Map to queue insertion index based on cumulative end day
      let cum = 0;
      for (let i = 0; i < s.queue.length; i++) {
        const t = taskById(s.queue[i]);
        const len = t ? t.mandays : 0;
        const start = cum;
        const end = start + len;
        if (dropDay <= Math.max(start, Math.floor((start + end) / 2))) {
          return i; // before this task
        }
        if (dropDay < end) {
          return i + 1; // inside block -> after it
        }
        cum = end;
      }
      return s.queue.length;
    };
    makeDroppable(row, (taskId, index) => enqueueTaskToStaffAt(taskId, s.id, index), row, computeRowIndex);

    // Tasks overlay
    const tasksLayer = document.createElement("div");
    tasksLayer.className = "tasks";

    // Calculate cumulative start index and render blocks
    let cursor = 0;
    s.queue.forEach((taskId) => {
      const t = taskById(taskId);
      if (!t) return;
      const startIdx = cursor;
      const endIdx = startIdx + t.mandays;
      cursor = endIdx;

      const block = document.createElement("div");
      block.className = "block";
      block.style.left = `calc(${startIdx} * var(--cell-width))`;
      block.style.width = `calc(${t.mandays} * var(--cell-width))`;
      block.title = `${t.name} (${t.mandays}d${t.theme ? ', ' + t.theme : ''})`;
      block.innerHTML = `<span>${escapeHTML(t.name)}</span>
        <span class=\"meta\">${t.mandays}d</span>
        ${t.jira ? `<a class=\"jira\" href=\"${escapeHTML(t.jira)}\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Open Jira\">↗</a>` : ''}`;
      block.dataset.taskId = t.id;

      block.addEventListener("click", () => returnTaskToBacklogAt(t.id, 0));
      block.draggable = true;
      block.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", t.id);
        e.dataTransfer.effectAllowed = "move";
      });
      // Apply theme coloring to block
      applyThemeToBlock(block, t.theme);
      // Prevent link click from returning task to backlog
      block.querySelector('.jira')?.addEventListener('click', (e) => e.stopPropagation());

      tasksLayer.appendChild(block);
    });

    row.appendChild(grid);
    row.appendChild(tasksLayer);
    row.appendChild(label);
    row.appendChild(dropzone);
    rowsWrapper.appendChild(row);
  });

  el.ganttBody.appendChild(rowsWrapper);
}

function renderAll() {
  // Ensure CSS zoom
  document.documentElement.style.setProperty("--cell-width", `${state.zoom || 32}px`);

  const horizon = computeHorizon();
  const axis = buildDateAxis(state.startDate, horizon, state.skipWeekends);
  renderHeader(axis);
  renderBacklog();
  renderStaffList();
  renderGantt(axis);
  renderThemesSummary();
}

// --- Themes Summary ---
function renderThemesSummary() {
  const container = el.themesPanel;
  if (!container) return;
  container.innerHTML = '';

  // Aggregate mandays by theme
  const map = new Map();
  let maxDays = 0;
  let totalItems = 0;
  for (const t of state.tasks) {
    const key = (t.theme || '').trim();
    if (!key) continue; // skip unthemed for now
    const days = Math.max(1, Math.floor(t.mandays || 0));
    const cur = map.get(key) || { theme: key, days: 0, count: 0 };
    cur.days += days; cur.count += 1;
    map.set(key, cur);
    if (cur.days > maxDays) maxDays = cur.days;
    totalItems++;
  }

  if (map.size === 0) {
    const empty = document.createElement('div');
    empty.className = 'theme-empty';
    empty.textContent = 'No themes yet';
    container.appendChild(empty);
    return;
  }

  const items = Array.from(map.values()).sort((a, b) => b.days - a.days);
  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'theme-row';

    const name = document.createElement('div');
    name.className = 'theme-name';
    name.textContent = item.theme;

    const barWrap = document.createElement('div');
    barWrap.className = 'theme-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'theme-bar';
    const pct = maxDays ? Math.round((item.days / maxDays) * 100) : 0;
    bar.style.width = pct + '%';
    // Colorize bar using same theme color mapping
    const hue = themeHue(item.theme);
    bar.style.background = `linear-gradient(90deg, hsla(${hue},70%,60%,0.9), hsla(${(hue+20)%360},70%,50%,0.9))`;
    barWrap.appendChild(bar);

    const days = document.createElement('div');
    days.className = 'theme-days';
    days.textContent = `${item.days}d`;

    row.appendChild(name);
    row.appendChild(barWrap);
    row.appendChild(days);
    container.appendChild(row);
  }
}

// --- CSV Export ---
function csvEscape(val) {
  const s = (val ?? '').toString();
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function buildExportRows() {
  const seen = new Set();
  const rows = [];

  // Backlog tasks first
  state.backlog.forEach((id) => {
    const t = taskById(id); if (!t) return; seen.add(id);
    rows.push([t.name, t.mandays, '', t.theme || '', t.jira || '']);
  });

  // Assigned tasks by staff and queue order
  state.staff.forEach((s) => {
    s.queue.forEach((id) => {
      const t = taskById(id); if (!t) return; seen.add(id);
      rows.push([t.name, t.mandays, s.name, t.theme || '', t.jira || '']);
    });
  });

  // Any remaining tasks (if any)
  state.tasks.forEach((t) => {
    if (seen.has(t.id)) return;
    rows.push([t.name, t.mandays, '', t.theme || '', t.jira || '']);
  });

  return rows;
}

function exportCSV() {
  const header = ['name', 'mandays', 'staff', 'theme', 'jira'];
  const rows = buildExportRows();
  const lines = [header, ...rows].map((r) => r.map(csvEscape).join(','));
  const csv = lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  a.href = url;
  a.download = `gantt-export-${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- DnD helpers ---
function makeDroppable(element, onDrop, highlightEl, computeIndex) {
  const target = highlightEl || element;
  element.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    target.classList.add("drag-over");
  });
  element.addEventListener("dragleave", () => target.classList.remove("drag-over"));
  element.addEventListener("drop", (e) => {
    e.preventDefault();
    target.classList.remove("drag-over");
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      const index = computeIndex ? computeIndex(e) : undefined;
      onDrop(taskId, index);
    }
  });
}

function insertAt(arr, index, value) {
  const idx = Math.max(0, Math.min(index ?? arr.length, arr.length));
  arr.splice(idx, 0, value);
}

function enqueueTaskToStaffAt(taskId, staffId, index) {
  if (!taskById(taskId)) return;
  const staff = state.staff.find((s) => s.id === staffId);
  if (!staff) return;
  const oldIndex = staff.queue.indexOf(taskId);
  // Remove everywhere first
  state.backlog = state.backlog.filter((id) => id !== taskId);
  state.staff.forEach((s) => (s.queue = s.queue.filter((id) => id !== taskId)));
  let idx = Math.max(0, Math.min(index ?? staff.queue.length, staff.queue.length));
  if (oldIndex >= 0 && index != null && index > oldIndex) idx--; // adjust when moving down within same queue
  staff.queue.splice(idx, 0, taskId);
  saveState();
  renderAll();
}

function returnTaskToBacklogAt(taskId, index) {
  // Capture old index if present
  const oldIndex = state.backlog.indexOf(taskId);
  // Remove from all queues
  state.staff.forEach((s) => (s.queue = s.queue.filter((id) => id !== taskId)));
  // Remove existing in backlog if present
  state.backlog = state.backlog.filter((id) => id !== taskId);
  let idx = Math.max(0, Math.min(index ?? 0, state.backlog.length));
  if (oldIndex >= 0 && index != null && index > oldIndex) idx--; // adjust when moving down within backlog
  state.backlog.splice(idx, 0, taskId);
  saveState();
  renderAll();
}

// --- Event wiring ---
el.addTaskBtn.addEventListener("click", () => {
  const name = el.taskName.value.trim();
  const days = parseInt(el.taskDays.value, 10) || 1;
  const theme = (el.taskTheme?.value || '').trim();
  if (!name) return;
  addTask(name, days, undefined, theme);
  el.taskName.value = "";
  el.taskDays.value = "1";
  if (el.taskTheme) el.taskTheme.value = "";
  el.taskName.focus();
});

el.taskName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") el.addTaskBtn.click();
});

el.addStaffBtn.addEventListener("click", () => {
  const name = el.staffName.value.trim();
  if (!name) return;
  addStaff(name);
  el.staffName.value = "";
  el.staffName.focus();
});

el.staffName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") el.addStaffBtn.click();
});

el.startDate.addEventListener("change", () => {
  state.startDate = el.startDate.value || todayISO();
  saveState();
  renderAll();
});

el.skipWeekends.addEventListener("change", () => {
  state.skipWeekends = el.skipWeekends.checked;
  saveState();
  renderAll();
});

el.zoom.addEventListener("input", () => {
  state.zoom = parseInt(el.zoom.value, 10) || 32;
  saveState();
  renderAll();
});

el.clearAll.addEventListener("click", () => {
  if (!confirm("Clear all data?")) return;
  state = Object.assign({}, defaultState, { startDate: el.startDate.value || todayISO(), zoom: state.zoom });
  saveState();
  renderAll();
});

// --- HTML escaping ---
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));
}

// --- CSV Import ---
function parseCSV(text) {
  // Minimal CSV parser supporting quotes, escaped quotes, newlines
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  // Strip BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      inQuotes = !inQuotes; i++; continue;
    }
    if (!inQuotes && (ch === ',')) { row.push(field); field = ''; i++; continue; }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      row.push(field); field = '';
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row);
      row = [];
      // Handle CRLF
      if (ch === '\r' && text[i + 1] === '\n') i += 2; else i++;
      continue;
    }
    field += ch; i++;
  }
  // Last field
  if (field.length > 0 || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function importCSVText(text) {
  const rows = parseCSV(text);
  if (!rows.length) return { imported: 0, queued: 0, skipped: 0 };
  // Header mapping
  let header = rows[0].map((h) => (h || '').toString().trim().toLowerCase());
  let startIdx = 1;
  // Normalize headers to match variants like "Jira URL", "jira_link"
  const norm = (h) => h.replace(/[^a-z]/g, '');
  const normed = header.map(norm);
  let idxName = normed.indexOf('name');
  let idxDays = normed.indexOf('mandays');
  let idxStaff = normed.indexOf('staff');
  // Theme support
  const themeAliases = new Set(['theme','epic']);
  let idxTheme = normed.findIndex((h) => themeAliases.has(h));
  const jiraAliases = new Set(['jira','jiralink','jiraurl','url','link']);
  let idxJira = normed.findIndex((h) => jiraAliases.has(h));
  // If header not detected, assume first row is data with [name, mandays, staff?]
  if (idxName === -1 && idxDays === -1) {
    idxName = 0; idxDays = 1; idxStaff = 2; idxJira = 3; idxTheme = 4; startIdx = 0;
  }

  let imported = 0, queued = 0, skipped = 0;

  function getOrCreateStaffByName(name) {
    const key = name.trim().toLowerCase();
    if (!key) return null;
    let s = state.staff.find((x) => x.name.trim().toLowerCase() === key);
    if (!s) { s = { id: uid('staff'), name: name.trim(), queue: [] }; state.staff.push(s); }
    return s;
  }

  for (let r = startIdx; r < rows.length; r++) {
    const cols = rows[r];
    const name = (cols[idxName] || '').toString().trim();
    const daysRaw = (cols[idxDays] || '').toString().trim();
    const staffName = idxStaff >= 0 ? (cols[idxStaff] || '').toString().trim() : '';
    const jiraLink = idxJira >= 0 ? (cols[idxJira] || '').toString().trim() : '';
    const themeVal = idxTheme >= 0 ? (cols[idxTheme] || '').toString().trim() : '';
    const mandays = Math.max(1, Math.floor(parseFloat(daysRaw)) || 0);
    if (!name || mandays <= 0) { skipped++; continue; }

    const t = { id: uid('task'), name, mandays };
    if (jiraLink) t.jira = jiraLink;
    if (themeVal) t.theme = themeVal;
    state.tasks.push(t);
    if (staffName) {
      const s = getOrCreateStaffByName(staffName);
      if (s) { s.queue.push(t.id); queued++; } else { state.backlog.unshift(t.id); }
    } else {
      state.backlog.unshift(t.id);
    }
    imported++;
  }

  saveState();
  renderAll();
  return { imported, queued, skipped };
}

// Import UI wiring
el.importBtn?.addEventListener('click', () => el.importFile?.click());
el.importFile?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = reader.result.toString();
      const res = importCSVText(text);
      alert(`Import complete\nImported: ${res.imported}\nQueued to staff: ${res.queued}\nSkipped: ${res.skipped}`);
    } catch (err) {
      console.error(err);
      alert('Failed to import CSV. Please check the format.');
    } finally {
      e.target.value = '';
    }
  };
  reader.onerror = () => {
    alert('Failed to read file.');
  };
  reader.readAsText(file);
});

// Export CSV wiring
byId('exportBtn')?.addEventListener('click', exportCSV);

// No automatic sample data seeding

// Initial render
renderAll();
