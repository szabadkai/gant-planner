import { useMemo } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useBacklog, useCreateTask, useMoveTask, useAutoAssign, useAllTasks } from '../hooks';
import type { Task } from '../types';
import SortableItem from './SortableItem';

function BacklogItem({ task }: { task: Task }) {
  const dependencies = task.dependencies ? JSON.parse(task.dependencies) : [];
  const priorityColors = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
  const priorityColor = priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM;
  
  return (
    <div className="card" data-id={task.id}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong>{task.name}</strong>
        {task.theme && <span style={{ fontSize: 12, color: '#6b7280' }}>• {task.theme}</span>}
        <div
          style={{
            backgroundColor: priorityColor,
            color: 'white',
            borderRadius: '50%',
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 'bold',
          }}
          title={`Priority: ${task.priority || 'MEDIUM'}`}
        >
          {task.priority?.charAt(0) || 'M'}
        </div>
      </div>
      {task.dueDate && (
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}
      {dependencies.length > 0 && (
        <div style={{ fontSize: 12, color: '#9333ea' }}>
          Depends on {dependencies.length} task{dependencies.length > 1 ? 's' : ''}
        </div>
      )}
      <span className="meta">{task.mandays}d</span>
    </div>
  );
}

export default function BacklogPanel() {
  const { data: tasks } = useBacklog();
  const { data: allTasks } = useAllTasks();
  const { mutate: createTask } = useCreateTask();
  const { mutate: move } = useMoveTask();
  const { autoAssign, isLoading } = useAutoAssign();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const ids = useMemo(() => (tasks ?? []).map((t) => t.id), [tasks]);

  const onDragEnd = (ev: DragEndEvent) => {
    const overId = ev.over?.id as string | undefined;
    const activeId = ev.active.id as string;
    if (!overId || overId === activeId || !tasks) return;
    const oldIndex = ids.indexOf(activeId);
    const newIndex = ids.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    // Compute neighbors
    const before = newOrder[newIndex - 1] ?? null;
    const after = newOrder[newIndex + 1] ?? null;
    move({ taskId: activeId, targetStaffId: null, beforeTaskId: before, afterTaskId: after });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const mandays = Math.max(1, Number(fd.get('mandays') || 1));
    const theme = String(fd.get('theme') || '').trim();
    const jiraUrl = String(fd.get('jiraUrl') || '').trim();
    const priority = String(fd.get('priority') || 'MEDIUM');
    const dueDate = String(fd.get('dueDate') || '').trim();
    const dependencies = Array.from(fd.getAll('dependencies')).map(String).filter(Boolean);
    if (!name) return;
    createTask({ 
      name, 
      mandays, 
      theme: theme || undefined, 
      jiraUrl: jiraUrl || undefined,
      priority,
      dueDate: dueDate || undefined,
      dependencies: dependencies.length > 0 ? dependencies : undefined
    });
    e.currentTarget.reset();
  };

  const isMobile = window.innerWidth < 768;

  return (
    <section>
      <h2>Backlog</h2>
      <form 
        onSubmit={onSubmit} 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2fr 80px 1fr 1fr 100px 100px auto auto', 
          gap: isMobile ? '8px' : '6px', 
          alignItems: 'center', 
          marginBottom: 16,
          padding: isMobile ? '8px' : '0',
          background: isMobile ? 'var(--panel)' : 'transparent',
          borderRadius: isMobile ? '6px' : '0',
          border: isMobile ? '1px solid var(--border)' : 'none'
        }}
      >
        {/* Row 1: Name and Days */}
        <input 
          name="name" 
          placeholder="Task name" 
          style={{ 
            gridColumn: isMobile ? '1' : '1',
            fontSize: isMobile ? '16px' : '14px',
            padding: isMobile ? '8px' : '6px 8px'
          }} 
          required 
        />
        <input 
          name="mandays" 
          type="number" 
          min={1} 
          defaultValue={1} 
          style={{ 
            gridColumn: isMobile ? '1' : '2',
            fontSize: isMobile ? '16px' : '14px',
            padding: isMobile ? '8px' : '6px 8px'
          }} 
        />
        
        {/* Row 2: Theme and Priority */}
        <input 
          name="theme" 
          placeholder="Theme (optional)" 
          style={{ 
            gridColumn: isMobile ? '1' : '3',
            fontSize: isMobile ? '16px' : '14px',
            padding: isMobile ? '8px' : '6px 8px'
          }} 
        />
        <select 
          name="priority" 
          defaultValue="MEDIUM"
          style={{ 
            gridColumn: isMobile ? '1' : '5',
            fontSize: isMobile ? '16px' : '14px',
            padding: isMobile ? '8px' : '6px 8px'
          }}
        >
          <option value="HIGH">🔴 High</option>
          <option value="MEDIUM">🟡 Medium</option>
          <option value="LOW">🟢 Low</option>
        </select>
        
        {/* Row 3: Jira URL and Due Date */}
        <input 
          name="jiraUrl" 
          placeholder="Jira URL (optional)" 
          style={{ 
            gridColumn: isMobile ? '1' : '4',
            fontSize: isMobile ? '16px' : '14px',
            padding: isMobile ? '8px' : '6px 8px'
          }} 
        />
        <input 
          name="dueDate" 
          type="date" 
          style={{ 
            gridColumn: isMobile ? '1' : '6',
            fontSize: isMobile ? '16px' : '14px',
            padding: isMobile ? '8px' : '6px 8px'
          }} 
        />
        
        {/* Row 4: Dependencies (mobile only) or same row (desktop) */}
        {isMobile ? (
          <select 
            name="dependencies" 
            multiple 
            style={{ 
              gridColumn: '1',
              minHeight: '60px',
              fontSize: '16px',
              padding: '8px'
            }}
          >
            {allTasks?.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.mandays}d)</option>
            ))}
          </select>
        ) : (
          <select 
            name="dependencies" 
            multiple 
            style={{ 
              gridColumn: '7',
              height: '60px',
              fontSize: '14px',
              padding: '6px 8px',
              minWidth: '120px'
            }}
          >
            {allTasks?.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.mandays}d)</option>
            ))}
          </select>
        )}
        
        {/* Submit button */}
        <button 
          type="submit"
          style={{
            gridColumn: isMobile ? '1' : '8',
            fontSize: isMobile ? '16px' : '14px',
            padding: isMobile ? '12px' : '6px 12px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {isMobile ? '➕ Add Task' : 'Add'}
        </button>
      </form>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="list">
            {(tasks ?? []).map((t) => (
              <SortableItem key={t.id} id={t.id}>
                <BacklogItem task={t} />
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
