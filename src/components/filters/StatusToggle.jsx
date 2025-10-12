import React from 'react';

const statuses = [
  { id: 'all', label: 'Все' },
  { id: 'in_work', label: 'В работе' },
  { id: 'assigned', label: 'Назначено' },
  { id: 'confirmed', label: 'Подтв.' },
  { id: 'client_refusal', label: 'Отказ' },
  { id: 'low_quality', label: 'Некач.' }
];

const StatusToggle = ({ value, onChange }) => {
  return (
    <div className="flex items-center bg-white border border-gray-300 rounded-lg h-[30px] px-1 space-x-1">
      {statuses.map(s => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`h-[22px] px-2 rounded-md text-[11px] font-medium nav-transition ${value === s.id ? 'bg-yellow-400 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >{s.label}</button>
      ))}
    </div>
  );
};

export default StatusToggle;
