import React, { useEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const presets = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week', label: '7д' },
  { id: 'month', label: 'Этот месяц' },
  { id: 'prevMonth', label: 'Пред.мес' }
];

const DateRangeCompact = ({ value, onChange }) => {
  const toRef = useRef(null);
  const popRef = useRef(null);
  const [open, setOpen] = useState(false);
  // draft local state (detached until confirm)
  const [draft, setDraft] = useState(() => ({ ...value }));

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const computePresetRange = (preset) => {
    const today = new Date();
    let fromDate = today;
    let toDate = today;
    switch (preset) {
      case 'today': {
        fromDate = today; toDate = today; break;
      }
      case 'week': { // last 7 days inclusive
        toDate = today;
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 6);
        break;
      }
      case 'month': { // current calendar month
        const y = today.getFullYear();
        const m = today.getMonth();
        // first day of current month
        fromDate = new Date(y, m, 1);
        // last day of current month
        toDate = new Date(y, m + 1, 0);
        break;
      }
      case 'prevMonth': { // full previous calendar month
        const y = today.getFullYear();
        const m = today.getMonth();
        // first day previous month
        fromDate = new Date(y, m - 1, 1);
        // last day previous month
        toDate = new Date(y, m, 0);
        break;
      }
      default: return { from: '', to: '' };
    }
    return { from: formatDate(fromDate), to: formatDate(toDate) };
  };

  const applyPreset = (presetId) => {
    const range = computePresetRange(presetId);
    // update local draft for immediate visual feedback
    setDraft({ preset: presetId, ...range });
    // immediately propagate to parent so data reloads without extra confirmation
    onChange({ preset: presetId, ...range });
  };

  // Auto-populate if preset chosen but dates empty
  // Sync external value into draft when popup opens (fresh baseline) or external changes elsewhere
  useEffect(() => {
    if(!open) setDraft({ ...value });
  }, [value, open]);

  const handleFromChange = (e) => {
    const newFrom = e.target.value;
    if (!newFrom) {
      onChange({ ...value, from: '', preset: 'custom' });
      return;
    }
    let newTo = value.to;
    if (newTo && newTo < newFrom) newTo = newFrom; // auto-correct
    if (!newTo) newTo = newFrom; // convenience: set same day & focus to
    onChange({ preset: 'custom', from: newFrom, to: newTo });
    // focus to input next tick for better UX
    setTimeout(() => { toRef.current && toRef.current.focus(); }, 0);
  };

  const handleToChange = (e) => {
    const newTo = e.target.value;
    if (!newTo) {
      onChange({ ...value, to: '', preset: 'custom' });
      return;
    }
    let newFrom = value.from;
    if (newFrom && newFrom > newTo) newFrom = newTo; // auto-correct
    if (!newFrom) newFrom = newTo;
    onChange({ preset: 'custom', from: newFrom, to: newTo });
  };

  // Calendar range selection (uses DayPicker). Convert value.from/to (yyyy-mm-dd) -> Date objects.
  const parseISO = (str) => { if(!str) return undefined; const [y,m,d] = str.split('-'); return new Date(Number(y), Number(m)-1, Number(d)); };
  const rangeSelected = { from: parseISO(draft.from), to: parseISO(draft.to) };

  const handleRangeSelect = (range) => {
    if(!range) return;
    const from = range.from ? formatDate(range.from) : '';
    const to = range.to ? formatDate(range.to) : '';
    setDraft(prev => ({ ...prev, preset: 'custom', from, to }));
    // Immediately apply when both boundaries are selected to auto-refresh data
    if (from && to) {
      onChange({ preset: 'custom', from, to });
    }
  };

  useEffect(() => {
    function handleClickOutside(e){
      if(open && popRef.current && !popRef.current.contains(e.target)) {
        // apply draft on outside close
        onChange(draft);
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, draft, onChange]);

  return (
    <div className="relative">
      <div className="flex items-center h-[30px] bg-white border border-gray-300 rounded-lg px-2 text-[12px]">
        <button onClick={() => setOpen(o=>!o)} className="flex items-center mr-3 text-gray-600 hover:text-yellow-600 nav-transition" type="button" aria-label="Открыть календарь">
          <Icon name="Calendar" size={14} className="text-gray-400 mr-1" />
          <span className="text-[11px] font-medium tracking-tight">
            {draft.from ? draft.from : '____-__-__'}
            <span className="mx-1 text-gray-400">→</span>
            {draft.to ? draft.to : (draft.from ? '…' : '____-__-__')}
          </span>
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={12} className="ml-1 opacity-50" />
        </button>
        <div className="flex items-center space-x-1">
          {presets.map(p => {
            const active = draft.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-2 h-[22px] rounded-md text-[11px] nav-transition ${active ? 'bg-yellow-400 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
              >{p.label}</button>
            );
          })}
        </div>
      </div>
      {open && (
        <div ref={popRef} className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-[320px]">
          <DayPicker
            mode="range"
            selected={rangeSelected}
            onSelect={handleRangeSelect}
            weekStartsOn={1}
            ISOWeek
            showOutsideDays
            styles={{
              caption: { fontSize: '12px', fontWeight: 600 },
              head_cell: { fontSize: '10px', color: '#6b7280' },
              cell: { fontSize: '11px' },
            }}
            classNames={{
              day: 'w-8 h-8 text-[11px] rounded-md nav-transition hover:bg-yellow-100 focus:outline-none focus:ring-1 focus:ring-yellow-400',
              day_selected: 'bg-yellow-400 text-white hover:bg-yellow-500',
              day_range_start: 'bg-yellow-500 text-white rounded-l-md',
              day_range_end: 'bg-yellow-500 text-white rounded-r-md',
              day_range_middle: 'bg-yellow-100 text-gray-800',
              caption_label: 'text-[12px] font-semibold text-gray-800',
              button_previous: 'text-gray-500 hover:text-yellow-600 nav-transition',
              button_next: 'text-gray-500 hover:text-yellow-600 nav-transition',
              month: 'space-y-2',
              months: 'flex flex-col',
              table: 'w-full border-collapse',
              tbody: 'space-y-1',
            }}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="text-[11px] text-gray-500 font-mono">{draft.from || '____-__-__'} → {draft.to || '____-__-__'}</div>
            <div className="flex gap-2">
              <button onClick={() => { setDraft({ preset: 'custom', from: '', to: '' }); }} className="text-[11px] px-2 h-7 rounded-md border border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600 nav-transition">Сброс</button>
              <button onClick={() => { onChange(draft); setOpen(false); }} className="text-[11px] px-3 h-7 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-medium nav-transition">Готово</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeCompact;
