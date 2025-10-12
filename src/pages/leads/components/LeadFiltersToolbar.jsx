import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const LeadFiltersToolbar = ({ filters, onFiltersChange, resultCount }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

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
      amountTo: '',
      search: ''
    });
    setShowAdvanced(false);
  };

  const hasActiveFilters = Object.entries(filters || {})?.some(([key, value]) => {
    if (key === 'dateRange') return value !== '30d';
    if (key === 'search') return value !== '';
    return value !== 'all' && value !== '';
  });

  const getActiveFiltersCount = () => {
    return Object.entries(filters || {})?.filter(([key, value]) => {
      if (key === 'dateRange') return value !== '30d';
      if (key === 'search') return value !== '';
      return value !== 'all' && value !== '';
    })?.length;
  };

  return (
    <div className="mb-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="Search" size={18} color="#9CA3AF" />
            </div>
            <input
              type="text"
              placeholder="Поиск по имени, телефону или заметкам..."
              value={filters?.search || ''}
              onChange={(e) => handleFilterChange('search', e?.target?.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
            />
          </div>
          
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
              showAdvanced 
                ? 'bg-yellow-500 text-black' :'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon name="Settings" size={16} />
            <span>Фильтры</span>
            {hasActiveFilters && (
              <span className="bg-yellow-400 text-black rounded-full px-2 py-0.5 text-xs font-bold">
                {getActiveFiltersCount()}
              </span>
            )}
            <Icon name={showAdvanced ? "ChevronUp" : "ChevronDown"} size={16} />
          </button>
          
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters}
              className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm transition-colors flex items-center space-x-2"
            >
              <Icon name="X" size={16} />
              <span>Сбросить</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <Icon name="Filter" size={16} className="mr-2" />
              Расширенные фильтры
            </h3>
          </div>
          
          <div className="p-6">
            {/* Primary Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Период
                </label>
                <select 
                  value={filters?.dateRange || '30d'}
                  onChange={(e) => {
                    handleFilterChange('dateRange', e?.target?.value);
                    if (e?.target?.value === 'custom') {
                      setShowCustomDateRange(true);
                    } else {
                      setShowCustomDateRange(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                >
                  <option value="today">Сегодня</option>
                  <option value="7d">7 дней</option>
                  <option value="30d">30 дней</option>
                  <option value="90d">90 дней</option>
                  <option value="custom">Свой период</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select 
                  value={filters?.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                >
                  <option value="all">Все статусы</option>
                  <option value="confirmed">✅ Подтверждено</option>
                  <option value="in_work">🔄 В работе</option>
                  <option value="assigned">👤 Назначено</option>
                  <option value="client_refusal">❌ Отказ клиента</option>
                  <option value="low_quality">⚠️ Низкое качество</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Источник
                </label>
                <select 
                  value={filters?.source || 'all'}
                  onChange={(e) => handleFilterChange('source', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                >
                  <option value="all">Все источники</option>
                  <option value="Avito">🏠 Avito</option>
                  <option value="Яндекс.Директ">🟡 Яндекс.Директ</option>
                  <option value="Google Ads">🔴 Google Ads</option>
                  <option value="Телефония">📞 Телефония</option>
                  <option value="Лендинги">🌐 Лендинги</option>
                  <option value="SEO">🔍 SEO</option>
                  <option value="Target">🎯 Target</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Качество
                </label>
                <select 
                  value={filters?.quality || 'all'}
                  onChange={(e) => handleFilterChange('quality', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                >
                  <option value="all">Все качества</option>
                  <option value="high">🟢 Высокое</option>
                  <option value="medium">🟡 Среднее</option>
                  <option value="low">🔴 Низкое</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range */}
            {showCustomDateRange && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Выберите период</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">От</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">До</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Город
                </label>
                <select 
                  value={filters?.city || 'all'}
                  onChange={(e) => handleFilterChange('city', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                >
                  <option value="all">Все города</option>
                  <option value="Москва">🏛️ Москва</option>
                  <option value="СПб">🌉 СПб</option>
                  <option value="Екатеринбург">🏭 Екатеринбург</option>
                  <option value="Казань">🕌 Казань</option>
                  <option value="Новосибирск">🌲 Новосибирск</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сумма от (₽)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters?.amountFrom || ''}
                  onChange={(e) => handleFilterChange('amountFrom', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сумма до (₽)
                </label>
                <input
                  type="number"
                  placeholder="999999"
                  value={filters?.amountTo || ''}
                  onChange={(e) => handleFilterChange('amountTo', e?.target?.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-400 rounded-lg">
              <Icon name="Search" size={18} color="#000000" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Найдено {resultCount} лидов
              </h3>
              <p className="text-sm text-gray-600">
                {hasActiveFilters 
                  ? `Применено фильтров: ${getActiveFiltersCount()}` 
                  : 'Показаны все доступные лиды'
                }
              </p>
            </div>
          </div>
          
          {resultCount > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Быстрые действия</div>
              <div className="flex items-center space-x-2 mt-1">
                <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors">
                  Выбрать все
                </button>
                <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors">
                  Экспорт
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadFiltersToolbar;