import type { Task } from '../types';
import { normalizeUrl } from '../lib/url';

export default function TaskCard({ task, onEdit, onDelete, dim }: { task: Task; onEdit?: (t: Task) => void; onDelete?: (t: Task) => void; dim?: boolean }) {
  return (
    <div className="card" data-id={task.id} style={dim ? { opacity: 0.35 } : undefined}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong title={task.name}>{task.name}</strong>
        {task.theme ? <span style={{ fontSize: 12, color: '#6b7280' }}>• {task.theme}</span> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {task.jiraUrl ? (
          <a
            href={normalizeUrl(task.jiraUrl)}
            target="_blank"
            rel="noopener noreferrer"
            title="Open link"
            onClick={(e) => e.stopPropagation()}
            style={{ textDecoration: 'none', fontWeight: 700 }}
          >↗︎</a>
        ) : null}
        <span className="meta">{task.mandays}d</span>
        {onEdit ? (
          <button type="button" onClick={() => onEdit(task)} title="Edit" style={{ padding: '4px 8px', borderRadius: 6 }}>Edit</button>
        ) : null}
        {onDelete ? (
          <button type="button" onClick={() => onDelete(task)} title="Delete" style={{ padding: '4px 8px', borderRadius: 6, background: '#991b1b', borderColor: '#991b1b' }}>Del</button>
        ) : null}
      </div>
    </div>
  );
}
