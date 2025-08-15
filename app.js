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
  addTaskBtn: byId("addTaskBtn"),
  importBtn: byId("importBtn"),
  importFile: byId("importFile"),
  clearAll: byId("clearAll"),
  ganttHeader: byId("ganttHeader"),
  ganttBody: byId("ganttBody"),
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
function addTask(name, mandays, jira) {
  const t = { id: uid("task"), name: name.trim(), mandays: Math.max(1, Math.floor(mandays)) };
  if (jira && typeof jira === 'string' && jira.trim()) t.jira = jira.trim();
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
    card.innerHTML = `<span class="name">${escapeHTML(t.name)}</span>${t.jira ? `
      <a class="jira" href="${escapeHTML(t.jira)}" target="_blank" rel="noopener noreferrer" title="Open Jira">↗</a>` : ''}
      <span class="days">${t.mandays}d</span>`;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", t.id);
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dblclick", () => removeTaskCompletely(t.id));
    // Prevent link click from triggering card actions
    card.querySelector('.jira')?.addEventListener('click', (e) => e.stopPropagation());
    el.backlog.appendChild(card);
  });

  // Allow dropping back tasks
  makeDroppable(el.backlog, (taskId) => returnTaskToBacklog(taskId));
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
    makeDroppable(row, (taskId) => enqueueTaskToStaff(taskId, s.id), row);

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
      block.title = `${t.name} (${t.mandays}d)`;
      block.innerHTML = `<span>${escapeHTML(t.name)}</span><span class="meta">${t.mandays}d</span>${t.jira ? `
        <a class=\"jira\" href=\"${escapeHTML(t.jira)}\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Open Jira\">↗</a>` : ''}`;
      block.dataset.taskId = t.id;

      block.addEventListener("click", () => returnTaskToBacklog(t.id));
      block.draggable = true;
      block.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", t.id);
        e.dataTransfer.effectAllowed = "move";
      });
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
    rows.push([t.name, t.mandays, '', t.jira || '']);
  });

  // Assigned tasks by staff and queue order
  state.staff.forEach((s) => {
    s.queue.forEach((id) => {
      const t = taskById(id); if (!t) return; seen.add(id);
      rows.push([t.name, t.mandays, s.name, t.jira || '']);
    });
  });

  // Any remaining tasks (if any)
  state.tasks.forEach((t) => {
    if (seen.has(t.id)) return;
    rows.push([t.name, t.mandays, '', t.jira || '']);
  });

  return rows;
}

function exportCSV() {
  const header = ['name', 'mandays', 'staff', 'jira'];
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
function makeDroppable(element, onDrop, highlightEl) {
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
    if (taskId) onDrop(taskId);
  });
}

// --- Event wiring ---
el.addTaskBtn.addEventListener("click", () => {
  const name = el.taskName.value.trim();
  const days = parseInt(el.taskDays.value, 10) || 1;
  if (!name) return;
  addTask(name, days);
  el.taskName.value = "";
  el.taskDays.value = "1";
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
  const jiraAliases = new Set(['jira','jiralink','jiraurl','url','link']);
  let idxJira = normed.findIndex((h) => jiraAliases.has(h));
  // If header not detected, assume first row is data with [name, mandays, staff?]
  if (idxName === -1 && idxDays === -1) {
    idxName = 0; idxDays = 1; idxStaff = 2; idxJira = 3; startIdx = 0;
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
    const mandays = Math.max(1, Math.floor(parseFloat(daysRaw)) || 0);
    if (!name || mandays <= 0) { skipped++; continue; }

    const t = { id: uid('task'), name, mandays };
    if (jiraLink) t.jira = jiraLink;
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
