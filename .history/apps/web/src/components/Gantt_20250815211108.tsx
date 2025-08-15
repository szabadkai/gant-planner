import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useMoveTask, useStaff } from '../hooks';
import { api } from '../api';
import { useDroppable, useDraggable, useDndMonitor } from '@dnd-kit/core';
import type { Task } from '../types';
import React from 'react';

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isWeekend(d: Date) { const n = d.getDay(); return n === 0 || n === 6; }
function fmt(d: Date) { return `${d.getMonth() + 1}/${d.getDate()}`; }

function buildAxis(startISO: string, count: number, skipWeekends: boolean): Date[] {
  const res: Date[] = [];
  let cur = new Date(startISO);
  while (res.length < count) {
    if (!skipWeekends || !isWeekend(cur)) res.push(new Date(cur));
    cur = addDays(cur, 1);
    if (res.length > 5000) break;
  }
  return res;
}

function hashHue(s?: string | null): number | null {
  if (!s) return null; const str = s.trim(); if (!str) return null;
  let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  h = h % 360; if (h < 0) h += 360; return h;
}

function applyTheme(el: HTMLElement, theme?: string | null) {
  const hue = hashHue(theme); if (hue == null) return;
  el.style.borderColor = `hsl(${hue}, 70%, 45%)`;
  el.style.background = `linear-gradient(135deg, hsla(${hue},70%,60%,0.22), hsla(${(hue+20)%360},70%,50%,0.22))`;
}

// Stable components extracted to avoid remount loops during drag
function GanttDropTarget({ taskId, leftPx, widthPx }: { taskId: string; leftPx: string; widthPx: string }) {
  const { setNodeRef } = useDroppable({ id: `gblock:${taskId}` });
  return <div ref={setNodeRef} style={{ position: 'absolute', left: leftPx, width: widthPx, top: 0, bottom: 0 }} />;
}

function GanttBlock({ task, staffId, start, end, leftPx, widthPx, themeFilter, onRemove, onEdgeHover, isJunctionHovered }: { task: Task; staffId: string; start: number; end: number; leftPx: string; widthPx: string; themeFilter?: string | null; onRemove?: (id: string) => void; onEdgeHover?: (info: { staffId: string; index: number } | null) => void; isJunctionHovered?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const [isDragEnding, setIsDragEnding] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  
  // Handle drag end animation with shorter duration for subtlety
  React.useEffect(() => {
    if (!isDragging && isDragEnding) {
      const timer = setTimeout(() => setIsDragEnding(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isDragging, isDragEnding]);

  React.useEffect(() => {
    if (isDragging) {
      setHasDragged(true);
      setIsDragEnding(false);
    } else if (!isDragging && hasDragged) {
      // Only trigger drag end animation if we actually dragged
      setIsDragEnding(true);
      setHasDragged(false);
    }
  }, [isDragging, hasDragged]);

  const style: React.CSSProperties = {
    left: leftPx,
    width: widthPx,
    opacity: (themeFilter && (task.theme || '').trim() && task.theme !== themeFilter) ? 0.35 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  const onMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget as HTMLDivElement;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const near = 10; // px from edge
    if (x <= near) {
      console.log('Left edge hover:', { staffId, index: start });
      onEdgeHover?.({ staffId, index: start });
    } else if (x >= rect.width - near) {
      console.log('Right edge hover:', { staffId, index: end });
      onEdgeHover?.({ staffId, index: end });
    } else {
      onEdgeHover?.(null);
    }
  };

  return (
    <div
      className="gantt-block"
      ref={(el) => { setNodeRef(el); if (el) applyTheme(el as HTMLElement, task.theme); }}
      title={`${task.name} (${task.mandays}d${task.theme ? ', ' + task.theme : ''})`}
      style={style}
      data-dragging={isDragging}
      data-drag-end={isDragEnding}
      data-junction-hover={isJunctionHovered}
      data-task-id={task.id}
      onDoubleClick={() => onRemove?.(task.id)}
      onMouseMove={onMove}
      onMouseLeave={() => onEdgeHover?.(null)}
      {...attributes}
      {...listeners}
    >
      <span>{task.name}</span>
      <span className="meta">{task.mandays}d</span>
    </div>
  );
}

function GanttRow({ staffId, name, tasks, axis, onSelectTask, onRemove, themeFilter, activeId, children, edgeHint, onEdgeHover }: { staffId: string; name: string; tasks: Task[]; axis: Date[]; onSelectTask?: (id: string) => void; onRemove?: (id: string) => void; themeFilter?: string | null; activeId?: string | null; children?: React.ReactNode; edgeHint?: { staffId: string; index: number } | null; onEdgeHover?: (info: { staffId: string; index: number } | null) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `gantt:${staffId}` });
  let cursor = 0;
  
  // Determine which blocks should show junction hover effect
  const getJunctionHoverState = (taskStart: number, taskEnd: number) => {
    if (!edgeHint || edgeHint.staffId !== staffId) return false;
    
    // The edgeHint.index represents the insertion point
    // We need to find blocks that are adjacent to this point
    // A block should move if its end position equals the insertion point (left block)
    // or if its start position equals the insertion point (right block)
    const isLeftBlock = taskEnd === edgeHint.index;
    const isRightBlock = taskStart === edgeHint.index;
    
    console.log('Junction hover check:', { 
      taskStart, 
      taskEnd, 
      edgeHint, 
      isLeftBlock, 
      isRightBlock,
      shouldMove: isLeftBlock || isRightBlock
    });
    
    return isLeftBlock || isRightBlock;
  };
  
  return (
    <div className={`gantt-row${isOver ? ' drag-over' : ''}`}>
      <div className="label">{name}</div>
      <div className="grid" ref={setNodeRef}>{axis.map((_, idx) => (<div className="cell" key={idx} />))}</div>
      <div className="blocks">
        {tasks.map((t, taskIndex) => {
          if (activeId && t.id === activeId) return null;
          const start = cursor; const width = t.mandays; cursor += t.mandays;
          const leftPx = `calc(${start} * var(--cell-width))`;
          const widthPx = `calc(${width} * var(--cell-width))`;
          const isJunctionHovered = getJunctionHoverState(start, start + width);

          return (
            <div key={t.id}>
              <GanttDropTarget taskId={t.id} leftPx={leftPx} widthPx={widthPx} />
              <GanttBlock 
                task={t} 
                staffId={staffId} 
                start={start} 
                end={start + width} 
                leftPx={leftPx} 
                widthPx={widthPx} 
                themeFilter={themeFilter} 
                onRemove={onRemove}
                isJunctionHovered={isJunctionHovered}
                onEdgeHover={onEdgeHover}
              />
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
}

export default function Gantt({ onSelectTask, themeFilter, startDate, skipWeekends, zoom }: { onSelectTask?: (id: string) => void; themeFilter?: string | null; startDate: string; skipWeekends: boolean; zoom: number }) {
  const { data: staff } = useStaff();
  const { mutate: move } = useMoveTask();
  const staffList = staff ?? [];
  const taskQueries = useQueries({ queries: staffList.map((s) => ({ queryKey: ['tasks', 'staff', s.id], queryFn: () => api.listTasksFor(s.id) })) });

  const [activeId, setActiveId] = useState<string | null>(null);

  // Build quick lookup for block positions (start index per task) and row end indices
  const positions = useMemo(() => {
    const pos = new Map<string, { staffId: string; start: number; end: number }>();
    const rowEnd = new Map<string, number>();
    staffList.forEach((s, i) => {
      const tasks = taskQueries[i]?.data ?? [];
      let cursor = 0;
      tasks.forEach((t) => {
        if (activeId && t.id === activeId) return; // collapse source while dragging
        pos.set(t.id, { staffId: s.id, start: cursor, end: cursor + t.mandays });
        cursor += t.mandays;
      });
      rowEnd.set(s.id, cursor);
    });
    return { pos, rowEnd };
  }, [
    staffList.map((s) => s.id).join(','),
    taskQueries.map((q, i) => (q.data ?? []).map((t) => `${t.id}:${t.mandays}`).join(',')).join('|'),
    activeId,
  ]);

  const [hint, setHint] = useState<null | { staffId: string; index: number }>(null);
  const [edgeHint, setEdgeHint] = useState<null | { staffId: string; index: number }>(null);

  useDndMonitor({
    onDragStart: (ev) => { setActiveId(String(ev.active.id)); setEdgeHint(null); },
    onDragOver: (ev) => {
      const overId = ev.over?.id as string | undefined;
      if (!overId) { setHint(null); setEdgeHint(null); return; }
      
      if (overId.startsWith('gblock:')) {
        const tid = overId.split(':', 2)[1];
        const p = positions.pos.get(tid);
        if (p) {
          setHint({ staffId: p.staffId, index: p.start });
          // The edgeHint will be set by the onEdgeHover callback from GanttBlock
        } else {
          setHint(null);
          setEdgeHint(null);
        }
      } else if (overId.startsWith('gantt:')) {
        const staffId = overId.split(':', 2)[1];
        const end = positions.rowEnd.get(staffId) ?? 0;
        setHint({ staffId, index: end });
        setEdgeHint(null);
      } else {
        setHint(null);
        setEdgeHint(null);
      }
    },
    onDragEnd: () => { setHint(null); setEdgeHint(null); setActiveId(null); },
    onDragCancel: () => { setHint(null); setEdgeHint(null); setActiveId(null); },
  });

  const horizon = useMemo(() => {
    let max = 30; // min
    taskQueries.forEach((q) => {
      const sum = (q.data ?? []).reduce((acc, t) => acc + (t.mandays || 0), 0);
      if (sum + 5 > max) max = sum + 5;
    });
    return max;
  }, [taskQueries.map((q) => q.data?.length ?? 0).join(',')]);

  const axis = useMemo(() => buildAxis(startDate, horizon, skipWeekends), [startDate, horizon, skipWeekends]);

  return (
    <section>
      <h2 style={{ display: 'none' }}>Gantt</h2>
      <div className="gantt" style={{ ['--cell-width' as any]: `${zoom}px` }}>
        <div className="gantt-header">
          <div className="gutter" />
          {axis.map((d, i) => (<div className="col" key={i}>{fmt(d)}</div>))}
        </div>
        <div className="gantt-body">
          <div className="gantt-rows">
            {staffList.map((s, i) => (
              <GanttRow
                key={s.id}
                staffId={s.id}
                name={s.name}
                tasks={taskQueries[i]?.data ?? []}
                axis={axis}
                onSelectTask={onSelectTask}
                onRemove={(id) => move({ taskId: id, targetStaffId: null, beforeTaskId: null, afterTaskId: null })}
                themeFilter={themeFilter}
                activeId={activeId}
                edgeHint={edgeHint}
                onEdgeHover={(info) => {
                  console.log('Setting edgeHint:', info);
                  setEdgeHint(info);
                }}
              >
                {hint && hint.staffId === s.id ? (
                  <div className="drop-hint" style={{ left: `calc(${hint.index} * var(--cell-width))` }} />
                ) : null}
              </GanttRow>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
