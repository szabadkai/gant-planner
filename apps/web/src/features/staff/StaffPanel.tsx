import { useState } from 'react';
import { useCreateStaff, useStaff, useDeleteStaff } from '../../shared/hooks';
import { Plus, UserPlus, X } from 'lucide-react';

export default function StaffPanel() {
  const { data: staff } = useStaff();
  const { mutate: createStaff } = useCreateStaff();
  const { mutate: deleteStaff } = useDeleteStaff();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createStaff(name.trim());
      setName('');
    }
  };

  return (
    <section>
      <form onSubmit={handleSubmit} className='row'>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Name'
        />
        <button
          type='submit'
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <UserPlus size={16} />
          Add
        </button>
      </form>
      <ul className='staff-list'>
        {(staff ?? []).map((s) => (
          <li key={s.id} className='staff-item'>
            <span className='staff-name' title={s.name}>
              {s.name}
            </span>
            <button
              className='remove'
              onClick={() => deleteStaff(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              <X size={14} />
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
