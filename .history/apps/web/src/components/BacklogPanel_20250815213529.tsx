import { useMemo } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useBacklog, useCreateTask, useMoveTask, useAutoAssign } from '../hooks';
import type { Task } from '../types';
import SortableItem from './SortableItem';

function BacklogItem({ task }: { task: Task }) {
  return (
    <div className="card" data-id={task.id}>
      <strong>{task.name}</strong>
      <span className="meta">{task.mandays}d</span>
    </div>
  );
}

export default function BacklogPanel() {
  const { data: tasks } = useBacklog();
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
    if (!name) return;
    createTask({ name, mandays, theme: theme || undefined, jiraUrl: jiraUrl || undefined });
    e.currentTarget.reset();
  };

  return (
    <section>
      <h2>Backlog</h2>
      <form onSubmit={onSubmit} className="row">
        <input name="name" placeholder="Task name" />
        <input name="mandays" type="number" min={1} defaultValue={1} style={{ width: 80 }} />
        <input name="theme" placeholder="Theme" />
        <input name="jiraUrl" placeholder="Jira URL" />
        <button type="submit">Add</button>
      </form>
      <div className="row" style={{ marginTop: 8 }}>
        <button 
          type="button" 
          onClick={autoAssign}
          disabled={isLoading || !tasks || tasks.length === 0}
          style={{ 
            background: 'var(--accent-2)', 
            borderColor: 'var(--accent-2)',
            width: '100%'
          }}
        >
          {isLoading ? 'Assigning...' : 'Auto-Assign Tasks'}
        </button>
      </div>
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
