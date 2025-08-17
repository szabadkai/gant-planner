import { useStaff, useStaffTasks } from '../hooks';

function StaffTasks({ staffId }: { staffId: string }) {
  const { data: tasks } = useStaffTasks(staffId);
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 8,
      }}
    >
      <div className='list'>
        {(tasks ?? []).map((t) => (
          <div key={t.id} className='card'>
            <strong>{t.name}</strong>
            <span className='meta'>{t.mandays}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StaffQueues() {
  const { data: staff } = useStaff();
  return (
    <section>
      <h2>Queues</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {(staff ?? []).map((s) => (
          <div key={s.id}>
            <h3 style={{ margin: '4px 0' }}>{s.name}</h3>
            <StaffTasks staffId={s.id} />
          </div>
        ))}
      </div>
    </section>
  );
}
