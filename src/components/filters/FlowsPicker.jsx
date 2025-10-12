import React, { useState, useRef, useEffect } from 'react';
import Icon from 'components/AppIcon';

const FlowsPicker = ({ value = [], onChange, flows = [] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter(f => f !== id));
    else onChange([...value, id]);
  };

  const clear = () => onChange([]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="h-[30px] bg-white border border-gray-300 rounded-lg px-2 flex items-center text-[12px] nav-transition hover:border-gray-400"
      >
        <Icon name="Layers" size={14} className="text-gray-400 mr-1" />
        {value.length === 0 ? 'Потоки' : `Потоки: ${value.length}`}
        {value.length > 0 && (
          <span
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="ml-2 text-gray-400 hover:text-red-500 text-[10px]"
          >×</span>
        )}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-sm p-2">
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
            {flows.map(flow => {
              const active = value.includes(flow.id);
              return (
                <button
                  key={flow.id}
                  onClick={() => toggle(flow.id)}
                  className={`flex w-full px-2 py-1 rounded-md text-[11px] nav-transition border text-left ${active ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'}`}
                >
                  <div className="flex-1 min-w-0">
                    {/* First line: flow name */}
                    <div className="truncate font-medium leading-tight" title={flow.name}>{flow.name}</div>
                    {/* Second line: source type + icon (order: type then icon) */}
                    <div className={`flex items-center gap-1 text-[10px] mt-0.5 ${active ? 'text-white/80' : 'text-gray-400'}`}>
                      <Icon name={flow.icon} size={10} className="opacity-60 flex-shrink-0" />
                      <span className="truncate">{flow.sourceType || '—'}</span>
                    </div>
                  </div>
                  {active && <span className="ml-2 text-[14px] leading-none">•</span>}
                </button>
              );
            })}
            {flows.length === 0 && <div className="text-[11px] text-gray-400 py-2 text-center">Нет потоков</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowsPicker;
