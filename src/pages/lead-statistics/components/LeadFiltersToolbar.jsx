import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const LeadFiltersToolbar = ({ filters, onFiltersChange, resultCount }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: '30d',
      status: 'all',
      source: 'all', 
      city: 'all',
      quality: 'all',
      amountFrom: '',
      amountTo: ''
    });
  };

  const hasActiveFilters = Object.entries(filters)?.some(([key, value]) => 
    key !== 'dateRange' && value !== 'all' && value !== ''
  );

  return (
    <div className="bg-surface rounded-lg border border-border p-3 mb-2 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={18} color="#FFD600" />
          <h3 className="text-base font-semibold text-text-primary">Фильтры</h3>
          <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            {resultCount} результатов
          </div>
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters}
              className="text-xs text-text-secondary hover:text-yellow-primary nav-transition flex items-center space-x-1"
            >
              <Icon name="X" size={12} />
              <span>Сбросить все</span>
            </button>
          )}
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-yellow-50 nav-transition"
        >
          <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} color="#757575" />
        </button>
      </div>

      {/* Main filters row - always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-2">
        {/* Date Range */}
        <div>
          <label className="text-xs text-text-secondary font-medium mb-1 block">Период</label>
          <select
            value={filters?.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e?.target?.value)}
            className="w-full text-sm border border-border rounded px-2 py-1 bg-surface text-text-primary focus:border-yellow-primary focus:outline-none nav-transition"
          >
            <option value="7d">7 дней</option>
            <option value="30d">30 дней</option>
            <option value="90d">90 дней</option>
            <option value="all">Все время</option>
          </select>
        </div>

        {/* Lead Status */}
        <div>
          <label className="text-xs text-text-secondary font-medium mb-1 block">Статус</label>
          <select
            value={filters?.status}
            onChange={(e) => handleFilterChange('status', e?.target?.value)}
            className="w-full text-sm border border-border rounded px-2 py-1 bg-surface text-text-primary focus:border-yellow-primary focus:outline-none nav-transition"
          >
            <option value="all">Все статусы</option>
            <option value="in_work">В работе</option>
            <option value="assigned">Назначена</option>
            <option value="confirmed">Подтвержден</option>
            <option value="client_refusal">Отказ клиента</option>
            <option value="low_quality">Некачественный</option>
          </select>
        </div>

        {/* Traffic Source */}
        <div>
          <label className="text-xs text-text-secondary font-medium mb-1 block">Источник</label>
          <select
            value={filters?.source}
            onChange={(e) => handleFilterChange('source', e?.target?.value)}
            className="w-full text-sm border border-border rounded px-2 py-1 bg-surface text-text-primary focus:border-yellow-primary focus:outline-none nav-transition"
          >
            <option value="all">Все источники</option>
            <option value="Avito">Avito</option>
            <option value="Яндекс.Директ">Яндекс.Директ</option>
            <option value="Телефония">Телефония</option>
            <option value="Лендинги">Лендинги</option>
            <option value="SEO">SEO</option>
            <option value="Target">Target</option>
          </select>
        </div>

        {/* City */}
        <div>
          <label className="text-xs text-text-secondary font-medium mb-1 block">Город</label>
          <select
            value={filters?.city}
            onChange={(e) => handleFilterChange('city', e?.target?.value)}
            className="w-full text-sm border border-border rounded px-2 py-1 bg-surface text-text-primary focus:border-yellow-primary focus:outline-none nav-transition"
          >
            <option value="all">Все города</option>
            <option value="Москва">Москва</option>
            <option value="СПб">Санкт-Петербург</option>
            <option value="Екатеринбург">Екатеринбург</option>
            <option value="Новосибирск">Новосибирск</option>
            <option value="Казань">Казань</option>
          </select>
        </div>

        {/* Quality */}
        <div>
          <label className="text-xs text-text-secondary font-medium mb-1 block">Качество</label>
          <select
            value={filters?.quality}
            onChange={(e) => handleFilterChange('quality', e?.target?.value)}
            className="w-full text-sm border border-border rounded px-2 py-1 bg-surface text-text-primary focus:border-yellow-primary focus:outline-none nav-transition"
          >
            <option value="all">Все уровни</option>
            <option value="high">Высокое</option>
            <option value="medium">Среднее</option>
            <option value="low">Низкое</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="text-xs text-text-secondary font-medium mb-1 block">Поиск</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Имя, телефон..."
              className="w-full text-sm border border-border rounded px-2 py-1 pr-7 bg-surface text-text-primary placeholder-text-secondary focus:border-yellow-primary focus:outline-none nav-transition"
            />
            <Icon name="Search" size={14} color="#757575" className="absolute right-2 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="border-t border-border pt-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Amount Range */}
            <div>
              <label className="text-xs text-text-secondary font-medium mb-1 block">Сумма от</label>
              <input
                type="number"
                placeholder="0"
                value={filters?.amountFrom}
                onChange={(e) => handleFilterChange('amountFrom', e?.target?.value)}
                className="w-full text-sm border border-border rounded px-2 py-1 bg-surface text-text-primary placeholder-text-secondary focus:border-yellow-primary focus:outline-none nav-transition"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium mb-1 block">Сумма до</label>
              <input
                type="number"
                placeholder="∞"
                value={filters?.amountTo}
                onChange={(e) => handleFilterChange('amountTo', e?.target?.value)}
                className="w-full text-sm border border-border rounded px-2 py-1 bg-surface text-text-primary placeholder-text-secondary focus:border-yellow-primary focus:outline-none nav-transition"
              />
            </div>

            {/* Date Range Custom */}
            <div>
              <label className="text-xs text-text-secondary font-medium mb-1 block">Дата с</label>
              <input
                type="date"
                className="w-full text-sm border border-border rounded px-2 py-1 bg-surface text-text-primary focus:border-yellow-primary focus:outline-none nav-transition"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium mb-1 block">Дата по</label>
              <input
                type="date"
                className="w-full text-sm border border-border rounded px-2 py-1 bg-surface text-text-primary focus:border-yellow-primary focus:outline-none nav-transition"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadFiltersToolbar;