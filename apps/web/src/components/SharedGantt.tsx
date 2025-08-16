import { useMemo, useState } from 'react';
import { useDndMonitor } from '@dnd-kit/core';
import type { Task, Staff } from '../types';
import React from 'react';

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isWeekend(d: Date) { const n = d.getDay(); return n === 0 || n === 6; }
function isWeekStart(d: Date) { return d.getDay() === 1; } // Monday
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

// Simplified task block for read-only view
function SharedTaskBlock({ task, leftPx, widthPx, themeFilters }: { task: Task; leftPx: string; widthPx: string; themeFilters?: string[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isDimmed = !!(themeFilters && themeFilters.length > 0 && !themeFilters.includes(task.theme || ''));
  
  React.useEffect(() => {
    if (ref.current && task.theme) {
      applyTheme(ref.current, task.theme);
    }
  }, [task.theme]);

  return (
    <div
      ref={ref}
      className="gantt-block"
      style={{
        left: leftPx,
        width: widthPx,
        opacity: isDimmed ? 0.2 : 1
      }}
      title={`${task.name} (${task.mandays}d)${task.theme ? ` [${task.theme}]` : ''}`}
    >
      <span style={{ 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        fontWeight: 500 
      }}>
        {task.name}
      </span>
    </div>
  );
}

function SharedGanttRow({ 
  staffId, 
  name, 
  tasks, 
  axis, 
  themeFilters 
}: { 
  staffId: string; 
  name: string; 
  tasks: Task[]; 
  axis: Date[]; 
  themeFilters?: string[]; 
}) {
  return (
    <div className="gantt-row">
      <div className="label">{name}</div>
      <div className="grid">
        {axis.map((d, i) => (<div className={`cell${isWeekStart(d) ? ' week-start' : ''}`} key={i} />))}
      </div>
      <div className="blocks">
        {tasks.map((task, index) => {
          const startIndex = tasks.slice(0, index).reduce((sum, t) => sum + t.mandays, 0);
          const leftPx = `calc(${startIndex} * var(--cell-width))`;
          const widthPx = `calc(${task.mandays} * var(--cell-width))`;
          
          return (
            <SharedTaskBlock
              key={task.id}
              task={task}
              leftPx={leftPx}
              widthPx={widthPx}
              themeFilters={themeFilters}
            />
          );
        })}
      </div>
    </div>
  );
}

interface SharedGanttProps {
  staff: Staff[];
  staffTasks: { [staffId: string]: Task[] };
  themeFilters?: string[];
  startDate: string;
  skipWeekends: boolean;
  zoom: number;
}

export default function SharedGantt({ 
  staff, 
  staffTasks, 
  themeFilters, 
  startDate, 
  skipWeekends, 
  zoom 
}: SharedGanttProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Build quick lookup for positions  
  const positions = useMemo(() => {
    const pos = new Map<string, { staffId: string; start: number; end: number }>();
    const rowEnd = new Map<string, number>();
    staff.forEach((s) => {
      const tasks = staffTasks[s.id] ?? [];
      let cursor = 0;
      tasks.forEach((t) => {
        if (activeId && t.id === activeId) return;
        pos.set(t.id, { staffId: s.id, start: cursor, end: cursor + t.mandays });
        cursor += t.mandays;
      });
      rowEnd.set(s.id, cursor);
    });
    return { pos, rowEnd };
  }, [
    staff.map((s) => s.id).join(','),
    Object.entries(staffTasks).map(([id, tasks]) => `${id}:${tasks.map(t => `${t.id}:${t.mandays}`).join(',')}`).join('|'),
    activeId,
  ]);

  useDndMonitor({
    onDragStart: (ev) => { setActiveId(String(ev.active.id)); },
    onDragEnd: () => { setActiveId(null); },
    onDragCancel: () => { setActiveId(null); },
  });

  const horizon = useMemo(() => {
    const maxEnd = Math.max(...Object.values(positions.rowEnd), 30);
    return Math.max(maxEnd, 30);
  }, [positions.rowEnd]);

  const axis = useMemo(() => buildAxis(startDate, horizon, skipWeekends), [startDate, horizon, skipWeekends]);

  return (
    <section>
      <h2 style={{ display: 'none' }}>Gantt</h2>
      <div className="gantt" style={{ ['--cell-width' as any]: `${zoom}px` }}>
        <div className="gantt-header">
          <div className="gutter" />
          {axis.map((d, i) => (<div className={`col${isWeekStart(d) ? ' week-start' : ''}`} key={i}>{fmt(d)}</div>))}
        </div>
        <div className="gantt-body">
          <div className="gantt-rows">
            {staff.map((s) => (
              <SharedGanttRow
                key={s.id}
                staffId={s.id}
                name={s.name}
                tasks={staffTasks[s.id] ?? []}
                axis={axis}
                themeFilters={themeFilters}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}