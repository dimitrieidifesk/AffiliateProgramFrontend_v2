import React, { useState, useRef, useEffect } from 'react';
import Icon from 'components/AppIcon';

/**
 * Single select dropdown with search
 * @param {string} value - Selected value (id or string)
 * @param {function} onChange - Callback(value)
 * @param {array} options - Array of {value, label} or strings
 * @param {string} placeholder - Placeholder text
 * @param {string} icon - Icon name from AppIcon
 * @param {boolean} disabled - Disabled state
 * @param {string} className - Additional classes
 */
const SingleSelect = ({ 
    value = '', 
    onChange, 
    options = [], 
    placeholder = 'Выберите',
    icon = null,
    disabled = false,
    className = ''
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { 
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Normalize options to {value, label} format
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'string') return { value: opt, label: opt };
        if (typeof opt === 'object' && opt !== null) {
            return {
                value: opt.value ?? opt.id ?? opt,
                label: opt.label ?? opt.name ?? opt.title ?? String(opt.value ?? opt.id ?? opt)
            };
        }
        return { value: opt, label: String(opt) };
    });

    const selectedOption = normalizedOptions.find(o => String(o.value) === String(value));
    const displayText = selectedOption ? selectedOption.label : placeholder;

    const filtered = normalizedOptions.filter(o => 
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (optValue) => {
        onChange(optValue);
        setOpen(false);
        setSearch('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearch('');
    };

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                onClick={() => !disabled && setOpen(o => !o)}
                disabled={disabled}
                className={`h-9 w-full bg-white border border-gray-300 rounded-md px-3 flex items-center justify-between text-[12px] nav-transition ${
                    disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-yellow-400'
                } ${value ? 'text-gray-900' : 'text-gray-500'}`}
            >
                <div className="flex items-center gap-2 flex-1 truncate">
                    {icon && <Icon name={icon} size={14} className="text-gray-400 shrink-0" />}
                    <span className="truncate">{displayText}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {value && !disabled && (
                        <span
                            onClick={handleClear}
                            className="text-gray-400 hover:text-red-500 text-[14px] font-bold leading-none"
                        >×</span>
                    )}
                    <Icon 
                        name={open ? "ChevronUp" : "ChevronDown"} 
                        size={14} 
                        className="text-gray-400" 
                    />
                </div>
            </button>
            {open && !disabled && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-gray-100">
                        <div className="flex items-center gap-1 border border-gray-200 rounded px-2 bg-gray-50">
                            <Icon name="Search" size={12} className="text-gray-400 shrink-0" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Поиск..."
                                className="flex-1 h-7 text-[11px] bg-transparent focus:outline-none"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                        {filtered.length === 0 && (
                            <div className="text-[11px] text-gray-400 py-3 text-center">
                                Нет результатов
                            </div>
                        )}
                        {filtered.map(opt => {
                            const active = String(opt.value) === String(value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={`w-full text-left text-[12px] px-3 py-2 nav-transition ${
                                        active 
                                            ? 'bg-yellow-50 text-gray-900 font-medium' 
                                            : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    {opt.label}
                                    {active && (
                                        <Icon name="Check" size={12} className="inline-block ml-2 text-yellow-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SingleSelect;
