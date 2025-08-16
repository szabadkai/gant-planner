import type { Task } from '../types';
import { normalizeUrl } from '../lib/url';

const priorityColors = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b', 
  LOW: '#10b981'
};

const priorityLabels = {
  HIGH: 'H',
  MEDIUM: 'M',
  LOW: 'L'
};

export default function TaskCard({ task, onEdit, onDelete, dim }: { task: Task; onEdit?: (t: Task) => void; onDelete?: (t: Task) => void; dim?: boolean }) {
  const dependencies = task.dependencies ? JSON.parse(task.dependencies) : [];
  const priorityColor = priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM;
  const priorityLabel = priorityLabels[task.priority as keyof typeof priorityLabels] || 'M';
  
  return (
    <div className="card" data-id={task.id} style={dim ? { opacity: 0.35 } : undefined}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong title={task.name}>{task.name}</strong>
        {task.theme ? <span style={{ fontSize: 12, color: '#6b7280' }}>• {task.theme}</span> : null}
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
          {priorityLabel}
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
