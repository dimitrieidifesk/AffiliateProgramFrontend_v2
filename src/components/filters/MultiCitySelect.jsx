import React, { useState, useRef, useEffect } from 'react';
import Icon from 'components/AppIcon';

const MultiCitySelect = ({ value = [], onChange, options = [] }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (city) => {
    if (value.includes(city)) onChange(value.filter(c => c !== city));
    else onChange([...value, city]);
  };

  const clear = () => onChange([]);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="h-[30px] bg-white border border-gray-300 rounded-lg px-2 flex items-center text-[12px] nav-transition hover:border-gray-400"
      >
        <Icon name="MapPin" size={14} className="text-gray-400 mr-1" />
        {value.length === 0 ? 'Города' : `Города: ${value.length}`}
        {value.length > 0 && (
          <span
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="ml-2 text-gray-400 hover:text-red-500 text-[10px]"
          >×</span>
        )}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-sm p-2">
          <div className="flex items-center mb-2 border border-gray-200 rounded px-1 bg-gray-50">
            <Icon name="Search" size={12} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="flex-1 h-6 text-[11px] bg-transparent px-1 focus:outline-none"
            />
          </div>
          <div className="max-h-40 overflow-y-auto pr-1 space-y-1">
            {filtered.map(city => {
              const active = value.includes(city);
              return (
                <button
                  key={city}
                  onClick={() => toggle(city)}
                  className={`w-full text-left text-[11px] h-7 px-2 rounded nav-transition ${active ? 'bg-yellow-400 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                >{city}</button>
              );
            })}
            {filtered.length === 0 && <div className="text-[11px] text-gray-400 py-2 text-center">Нет результатов</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiCitySelect;
