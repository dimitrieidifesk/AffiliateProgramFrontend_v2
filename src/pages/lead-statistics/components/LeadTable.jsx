import React from 'react';
import Icon from 'components/AppIcon';

const LeadTable = ({ 
  leads, 
  selectedLeads, 
  onLeadSelection, 
  sortConfig, 
  onSort, 
  formatCurrency 
}) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      'in_work': { label: 'В работе', color: 'bg-yellow-100 text-yellow-800', icon: 'Clock' },
      'assigned': { label: 'Назначена', color: 'bg-blue-100 text-blue-800', icon: 'UserCheck' },
      'confirmed': { label: 'Подтвержден', color: 'bg-success-100 text-success-700', icon: 'CheckCircle' },
      'client_refusal': { label: 'Отказ', color: 'bg-gray-100 text-gray-700', icon: 'XCircle' },
      'low_quality': { label: 'Некачественный', color: 'bg-red-100 text-red-700', icon: 'AlertCircle' }
    };

    const config = statusConfig?.[status] || statusConfig?.['in_work'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color}`}>
        <Icon name={config?.icon} size={12} className="mr-1" />
        {config?.label}
      </span>
    );
  };

  const getQualityBadge = (quality) => {
    const qualityConfig = {
      'high': { label: 'Высокое', color: 'bg-success-100 text-success-700' },
      'medium': { label: 'Среднее', color: 'bg-yellow-100 text-yellow-800' },
      'low': { label: 'Низкое', color: 'bg-red-100 text-red-700' }
    };

    const config = qualityConfig?.[quality] || qualityConfig?.['medium'];
    return (
      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${config?.color}`}>
        {config?.label}
      </span>
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onLeadSelection(leads?.map(lead => lead?.id));
    } else {
      onLeadSelection([]);
    }
  };

  const handleSelectLead = (leadId, checked) => {
    if (checked) {
      onLeadSelection([...selectedLeads, leadId]);
    } else {
      onLeadSelection(selectedLeads?.filter(id => id !== leadId));
    }
  };

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) {
      return <Icon name="ArrowUpDown" size={14} color="#757575" className="opacity-50" />;
    }
    return sortConfig?.direction === 'asc' 
      ? <Icon name="ArrowUp" size={14} color="#FFD600" />
      : <Icon name="ArrowDown" size={14} color="#FFD600" />;
  };

  const allSelected = leads?.length > 0 && selectedLeads?.length === leads?.length;
  const someSelected = selectedLeads?.length > 0 && selectedLeads?.length < leads?.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-border">
          <tr>
            <th className="px-2 py-2 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={input => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => handleSelectAll(e?.target?.checked)}
                className="w-4 h-4 text-yellow-primary border-border rounded focus:ring-yellow-primary"
              />
            </th>
            <th 
              className="px-2 py-2 text-left font-semibold text-text-primary cursor-pointer hover:bg-gray-100 nav-transition"
              onClick={() => onSort('date')}
            >
              <div className="flex items-center space-x-1">
                <span>Дата</span>
                {getSortIcon('date')}
              </div>
            </th>
            <th 
              className="px-2 py-2 text-left font-semibold text-text-primary cursor-pointer hover:bg-gray-100 nav-transition"
              onClick={() => onSort('source')}
            >
              <div className="flex items-center space-x-1">
                <span>Источник</span>
                {getSortIcon('source')}
              </div>
            </th>
            <th className="px-2 py-2 text-left font-semibold text-text-primary">
              Статус
            </th>
            <th 
              className="px-2 py-2 text-left font-semibold text-text-primary cursor-pointer hover:bg-gray-100 nav-transition"
              onClick={() => onSort('client')}
            >
              <div className="flex items-center space-x-1">
                <span>Клиент</span>
                {getSortIcon('client')}
              </div>
            </th>
            <th className="px-2 py-2 text-left font-semibold text-text-primary">
              Телефон
            </th>
            <th 
              className="px-2 py-2 text-left font-semibold text-text-primary cursor-pointer hover:bg-gray-100 nav-transition"
              onClick={() => onSort('city')}
            >
              <div className="flex items-center space-x-1">
                <span>Город</span>
                {getSortIcon('city')}
              </div>
            </th>
            <th 
              className="px-2 py-2 text-left font-semibold text-text-primary cursor-pointer hover:bg-gray-100 nav-transition"
              onClick={() => onSort('amount')}
            >
              <div className="flex items-center space-x-1">
                <span>Сумма</span>
                {getSortIcon('amount')}
              </div>
            </th>
            <th className="px-2 py-2 text-left font-semibold text-text-primary">
              Комиссия
            </th>
            <th className="px-2 py-2 text-left font-semibold text-text-primary">
              Качество
            </th>
            <th className="px-2 py-2 text-left font-semibold text-text-primary">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {leads?.map((lead) => (
            <tr 
              key={lead?.id} 
              className={`
                border-b border-border hover:bg-yellow-25 nav-transition
                ${selectedLeads?.includes(lead?.id) ? 'bg-yellow-50' : 'bg-surface'}
              `}
            >
              <td className="px-2 py-2">
                <input
                  type="checkbox"
                  checked={selectedLeads?.includes(lead?.id)}
                  onChange={(e) => handleSelectLead(lead?.id, e?.target?.checked)}
                  className="w-4 h-4 text-yellow-primary border-border rounded focus:ring-yellow-primary"
                />
              </td>
              <td className="px-2 py-2">
                <div className="text-text-primary font-medium">{lead?.date}</div>
                <div className="text-text-secondary text-xs">{lead?.time}</div>
              </td>
              <td className="px-2 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-primary"></div>
                  <span className="text-text-primary font-medium">{lead?.source}</span>
                </div>
              </td>
              <td className="px-2 py-2">
                {getStatusBadge(lead?.status)}
              </td>
              <td className="px-2 py-2">
                <div className="text-text-primary font-medium">{lead?.client}</div>
                {lead?.assignedTo && (
                  <div className="text-text-secondary text-xs">
                    → {lead?.assignedTo}
                  </div>
                )}
              </td>
              <td className="px-2 py-2">
                <a 
                  href={`tel:${lead?.phone}`}
                  className="text-text-primary hover:text-yellow-primary nav-transition font-mono text-sm"
                >
                  {lead?.phone}
                </a>
              </td>
              <td className="px-2 py-2">
                <span className="text-text-primary">{lead?.city}</span>
              </td>
              <td className="px-2 py-2">
                <div className="text-text-primary font-semibold">
                  {formatCurrency(lead?.amount)}
                </div>
              </td>
              <td className="px-2 py-2">
                <div className="text-success-600 font-medium">
                  {formatCurrency(lead?.commission)}
                </div>
              </td>
              <td className="px-2 py-2">
                {getQualityBadge(lead?.quality)}
              </td>
              <td className="px-2 py-2">
                <div className="flex items-center space-x-1">
                  <button className="p-1 rounded hover:bg-yellow-100 nav-transition group" title="Редактировать">
                    <Icon name="Edit2" size={14} color="#757575" className="group-hover:text-yellow-primary" />
                  </button>
                  <button className="p-1 rounded hover:bg-blue-100 nav-transition group" title="Позвонить">
                    <Icon name="Phone" size={14} color="#757575" className="group-hover:text-blue-600" />
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100 nav-transition group" title="Подробнее">
                    <Icon name="Eye" size={14} color="#757575" className="group-hover:text-gray-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty state */}
      {leads?.length === 0 && (
        <div className="text-center py-8">
          <Icon name="Search" size={48} color="#E0E0E0" className="mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Лиды не найдены</h3>
          <p className="text-text-secondary">Измените параметры фильтрации для отображения данных</p>
        </div>
      )}
    </div>
  );
};

export default LeadTable;