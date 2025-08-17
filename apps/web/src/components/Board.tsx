import { useMemo } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, pointerWithin, DragOverlay } from '@dnd-kit/core';
import { useBacklog, useCreateTask, useMoveTask, useStaff, useAutoAssign, useDeleteTask } from '../hooks';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import Papa from 'papaparse';
import DraggableItem from './DraggableItem';
import Droppable from './Droppable';
import TaskCard from './TaskCard';
import TaskDetailDrawer from './TaskDetailDrawer';
import Gantt from './Gantt';
import StaffPanel from './StaffPanel';
import ThemesPanel from './ThemesPanel';
import { useState, useEffect } from 'react';
import { Plus, Download, Upload, Zap, Trash2 } from 'lucide-react';

function AddTaskForm() {
  const { mutate: createTask } = useCreateTask();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const mandays = Math.max(1, Number(fd.get('mandays') || 1));
    const theme = String(fd.get('theme') || '').trim();
    const jiraUrl = String(fd.get('jiraUrl') || '').trim();
    if (!name) return;
    createTask({ name, mandays, theme: theme || undefined, jiraUrl: jiraUrl || undefined });
    e.currentTarget.reset();
  };
  return (
    <form onSubmit={onSubmit} className="row" aria-label="Add new task">
      <input name="name" placeholder="Task name" aria-label="Task name" required />
      <input name="mandays" type="number" min={1} defaultValue={1} style={{ width: 80 }} aria-label="Duration in days" />
      <input name="theme" placeholder="Theme" aria-label="Theme (optional)" />
      <input name="jiraUrl" placeholder="Jira URL" aria-label="Jira URL (optional)" />
      <button type="submit" aria-label="Add task to backlog" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Plus size={16} />
        Add
      </button>
    </form>
  );
}

export default function Board({ startDate, skipWeekends, zoom, sidebarCollapsed }: { startDate: string; skipWeekends: boolean; zoom: number; sidebarCollapsed: boolean }) {
  const [editing, setEditing] = useState<null | { id: string }>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [themeFilters, setThemeFilters] = useState<string[]>([]);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [announcement, setAnnouncement] = useState<string>('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const { data: backlog } = useBacklog();
  const { data: staff } = useStaff();
  const staffList = staff ?? [];
  const tasksQueries = useQueries({
    queries: staffList.map((s) => ({
      queryKey: ['tasks', 'staff', s.id],
      queryFn: () => api.listTasksFor(s.id),
    })),
  });
  const { mutate: move } = useMoveTask();
  const { autoAssign, isLoading } = useAutoAssign();
  const { mutate: deleteTask } = useDeleteTask();
  const qc = useQueryClient();

  // Get all tasks for navigation
  const allTasks = useMemo(() => {
    const tasks = [
      ...(backlog ?? []),
      ...tasksQueries.flatMap((q) => q.data ?? []),
    ];
    return tasks;
  }, [backlog, tasksQueries]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with form inputs or if editing
      if (editing || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          setShowNewTaskForm(true);
          // Focus the first input in the new task form
          setTimeout(() => {
            const taskNameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
            if (taskNameInput) taskNameInput.focus();
          }, 100);
          break;
          
        case 'delete':
        case 'backspace':
          if (selectedTaskId) {
            e.preventDefault();
            const task = allTasks.find(t => t.id === selectedTaskId);
            if (task && confirm(`Delete task "${task.name}"?`)) {
              deleteTask(selectedTaskId);
              setSelectedTaskId(null);
            }
          }
          break;
          
        case 'enter':
          if (selectedTaskId) {
            e.preventDefault();
            setEditing({ id: selectedTaskId });
          }
          break;
          
        case 'escape':
          e.preventDefault();
          setSelectedTaskId(null);
          setShowNewTaskForm(false);
          break;
          
        case 'arrowdown':
        case 'arrowup':
          e.preventDefault();
          if (allTasks.length > 0) {
            const currentIndex = selectedTaskId ? allTasks.findIndex(t => t.id === selectedTaskId) : -1;
            let nextIndex;
            
            if (e.key === 'ArrowDown') {
              nextIndex = currentIndex < allTasks.length - 1 ? currentIndex + 1 : 0;
            } else {
              nextIndex = currentIndex > 0 ? currentIndex - 1 : allTasks.length - 1;
            }
            
            setSelectedTaskId(allTasks[nextIndex]?.id || null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editing, selectedTaskId, allTasks, deleteTask]);

  const toggleThemeFilter = (theme: string) => {
    setThemeFilters(prev => 
      prev.includes(theme) 
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const containers = useMemo(() => {
    const map = new Map<string, string[]>();
    map.set('backlog', (backlog ?? []).map((t) => t.id));
    staffList.forEach((s, i) => {
      const tasks = tasksQueries[i]?.data ?? [];
      map.set(s.id, tasks.map((t) => t.id));
    });
    return map;
  }, [backlog, staffList.map((s) => s.id).join(','), tasksQueries.map((q) => q.data?.length ?? 0).join(',')]);

  const findContainerOf = (taskId: string): string | undefined => {
    for (const [cid, ids] of containers.entries()) if (ids.includes(taskId)) return cid;
    return undefined;
  };

  const onDragStart = (ev: DragStartEvent) => {
    setActiveId(String(ev.active.id));
  };

  const onDragEnd = (ev: DragEndEvent) => {
    setActiveId(null);
    const activeId = String(ev.active.id);
    const overId = ev.over ? String(ev.over.id) : undefined;
    const from = findContainerOf(activeId);
    if (!from) return;

    // Determine destination container and index
    let to: string | undefined;
    let index: number | undefined;
    if (overId) {
      // If over an item, destination is that item's container
      let overContainer = findContainerOf(overId);
      if (overContainer) {
        to = overContainer;
        index = containers.get(overContainer)!.indexOf(overId);
      } else {
        // Could be over a container droppable (namespaced)
        if (overId.startsWith('gblock:')) {
          const targetId = overId.split(':', 2)[1];
          overContainer = findContainerOf(targetId);
          if (overContainer) {
            to = overContainer;
            index = containers.get(overContainer)!.indexOf(targetId);
          }
        } else if (overId.startsWith('list:') || overId.startsWith('gantt:')) {
          const raw = overId.split(':', 2)[1];
          to = raw;
        } else {
          to = undefined;
        }
      }
    }
    if (!to) return;
    const fromIds = containers.get(from)!;
    const toIds = containers.get(to)!;
    const oldIndex = fromIds.indexOf(activeId);
    if (oldIndex === -1) return;

    // If dropping over a specific block (index defined), compute neighbors; else append
    if (typeof index === 'number') {
      if (to === from) {
        // Build order without active, insert before target index
        const base = toIds.filter((id) => id !== activeId);
        const insertionIndex = index > oldIndex ? index - 1 : index;
        const before = base[insertionIndex - 1] ?? null;
        const after = base[insertionIndex] ?? null; // target at insertion
        move({ taskId: activeId, targetStaffId: to === 'backlog' ? null : to, beforeTaskId: before, afterTaskId: after });
      } else {
        const before = toIds[index - 1] ?? null;
        const after = toIds[index] ?? null;
        move({ taskId: activeId, targetStaffId: to === 'backlog' ? null : to, beforeTaskId: before, afterTaskId: after });
      }
    } else {
      // Append to end
      if (to === from) {
        const base = toIds.filter((id) => id !== activeId);
        const before = base[base.length - 1] ?? null;
        move({ taskId: activeId, targetStaffId: to === 'backlog' ? null : to, beforeTaskId: before, afterTaskId: null });
      } else {
        move({ taskId: activeId, targetStaffId: to === 'backlog' ? null : to, beforeTaskId: null, afterTaskId: null });
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetection={pointerWithin}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: sidebarCollapsed ? '0fr 1fr' : '300px 1fr', 
        gap: 12, 
        height: '100%',
        transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <aside 
          className="sidebar" 
          role="complementary" 
          aria-label="Task management panels"
          style={{
            overflow: 'hidden',
            opacity: sidebarCollapsed ? 0 : 1,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: sidebarCollapsed ? 'none' : 'auto',
            minWidth: sidebarCollapsed ? 0 : 300
          }}
        >
          <div className="panel">
            <h2 id="backlog-heading">Backlog</h2>
            <AddTaskForm />
            <div className="row" style={{ marginTop: 4 }}>
              <button onClick={async () => {
                const rows: any[] = [];
                (backlog ?? []).forEach(t => rows.push({ name: t.name, mandays: t.mandays, staff: '', theme: t.theme || '', jira: t.jiraUrl || '' }));
                staffList.forEach((s, i) => {
                  const tasks = tasksQueries[i]?.data ?? [];
                  tasks.forEach(t => rows.push({ name: t.name, mandays: t.mandays, staff: s.name, theme: t.theme || '', jira: t.jiraUrl || '' }));
                });
                const csv = Papa.unparse(rows, { columns: ['name','mandays','staff','theme','jira'] as any });
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
              }} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Download size={16} />
                Export CSV
              </button>
              <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', cursor: 'pointer', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', color: 'var(--text-dim)' }}>
                <Upload size={16} />
                Import CSV
                <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return; const text = await file.text();
                  Papa.parse(text, { header: true, skipEmptyLines: true, complete: async (res: Papa.ParseResult<any>) => {
                    const rows: any[] = res.data as any[];
                    // Build a local index of staff name -> id so repeated names don't create duplicates
                    const staffIndex = new Map<string, string>(staffList.map(s => [s.name.toLowerCase(), s.id]));
                    for (const r of rows) {
                      const name = String(r.name || r.Name || '').trim();
                      const mandays = Math.max(1, Math.floor(Number(r.mandays || r.Mandays || 1)));
                      const staffName = String(r.staff || r.Staff || '').trim();
                      const theme = String(r.theme || r.Theme || '').trim();
                      const jira = String(r.jira || r.Jira || r.url || r.URL || '').trim();
                      if (!name) continue;
                      let targetStaffId: string | null = null;
                      if (staffName) {
                        const key = staffName.toLowerCase();
                        let id = staffIndex.get(key) || '';
                        if (!id) {
                          const created = await api.createStaff(staffName);
                          id = created.id;
                          staffIndex.set(key, id);
                        }
                        targetStaffId = id;
                      }
                      const task = await api.createTask({ name, mandays, theme: theme || undefined, jiraUrl: jira || undefined });
                      if (targetStaffId) { await api.move({ taskId: task.id, targetStaffId, beforeTaskId: null, afterTaskId: null }); }
                    }
                    // Refresh views after import
                    await qc.invalidateQueries({ queryKey: ['tasks'] });
                    await qc.invalidateQueries({ queryKey: ['staff'] });
                    await qc.invalidateQueries({ queryKey: ['themes'] });
                    e.target.value = '';
                  }});
                }} />
              </label>
              <button 
                onClick={autoAssign}
                disabled={isLoading || !backlog || backlog.length === 0 || !staffList || staffList.length === 0}
                style={{ background: 'var(--accent-2)', borderColor: 'var(--accent-2)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Zap size={16} />
                {isLoading ? 'Assigning...' : 'Auto-Assign'}
              </button>
              <button className="danger" onClick={async () => { if (confirm('Clear all data?')) { await api.clearAll(); location.reload(); } }} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trash2 size={16} />
                Clear All
              </button>
            </div>
            <Droppable id="list:backlog">
              <div 
                className="list" 
                role="list" 
                aria-labelledby="backlog-heading"
                aria-label="Backlog tasks"
              >
                {(backlog ?? []).map((t) => (
                  t.id === activeId ? null : (
                    <DraggableItem key={t.id} id={t.id}>
                      <TaskCard 
                        task={t} 
                        onEdit={() => setEditing({ id: t.id })} 
                        onClick={() => setSelectedTaskId(t.id)}
                        isSelected={selectedTaskId === t.id}
                        dim={!!(themeFilters.length > 0 && !themeFilters.includes(t.theme || ''))} 
                      />
                    </DraggableItem>
                  )
                ))}
              </div>
            </Droppable>
          </div>
          <div className="panel">
            <h2 id="staff-heading">Staff</h2>
            <StaffPanel />
          </div>
          <div className="panel">
            <h2 id="themes-heading">Themes</h2>
            <ThemesPanel selectedThemes={themeFilters} onToggle={toggleThemeFilter} />
          </div>
        </aside>
        <main className="main" role="main" aria-label="Gantt chart timeline">
          <div className="panel" style={{ padding: 0 }}>
            <Gantt onSelectTask={(id) => setEditing({ id })} themeFilters={themeFilters} startDate={startDate} skipWeekends={skipWeekends} zoom={zoom} />
          </div>
        </main>
      </div>
      {editing ? (
        (() => {
          const all = [
            ...(backlog ?? []),
            ...tasksQueries.flatMap((q) => q.data ?? []),
          ];
          const task = all.find((t) => t.id === editing.id);
          return task ? <TaskDetailDrawer task={task} onClose={() => setEditing(null)} /> : null;
        })()
      ) : null}

      <DragOverlay dropAnimation={null}>
        {(() => {
          if (!activeId) return null;
          const all = [
            ...(backlog ?? []),
            ...tasksQueries.flatMap((q) => q.data ?? []),
          ];
          const t = all.find((x) => x.id === activeId);
          return t ? (
            <div style={{ pointerEvents: 'none', maxWidth: 360, opacity: 0.5 }}>
              <TaskCard task={t} />
            </div>
          ) : null;
        })()}
      </DragOverlay>
    </DndContext>
  );
}
