import { useState } from 'react';
import { useCreateStaff, useStaff, useDeleteStaff } from '../hooks';

export default function StaffPanel() {
  const { data: staff } = useStaff();
  const { mutate: createStaff } = useCreateStaff();
  const { mutate: deleteStaff } = useDeleteStaff();
  const [name, setName] = useState('');

  return (
    <section>
      <div className="row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <button onClick={() => { if (name.trim()) { createStaff(name.trim()); setName(''); } }}>Add</button>
      </div>
      <ul className="staff-list">
        {(staff ?? []).map((s) => (
          <li key={s.id} className="staff-item">
            <span className="staff-name" title={s.name}>{s.name}</span>
            <button className="remove" onClick={() => deleteStaff(s.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
