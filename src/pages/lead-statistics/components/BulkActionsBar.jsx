import React from 'react';
import Icon from 'components/AppIcon';

const BulkActionsBar = ({ selectedCount, onBulkAction }) => {
  const actions = [
    {
      key: 'change_status',
      label: 'Изменить статус',
      icon: 'CheckCircle',
      color: 'text-blue-600 hover:bg-blue-100'
    },
    {
      key: 'assign_manager',
      label: 'Назначить менеджера',
      icon: 'UserCheck',
      color: 'text-green-600 hover:bg-green-100'
    },
    {
      key: 'export_selected',
      label: 'Экспортировать',
      icon: 'Download',
      color: 'text-yellow-600 hover:bg-yellow-100'
    },
    {
      key: 'delete',
      label: 'Удалить',
      icon: 'Trash2',
      color: 'text-red-600 hover:bg-red-100'
    }
  ];

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-2 flex items-center justify-between animate-fade-in">
      <div className="flex items-center space-x-2">
        <Icon name="CheckSquare" size={18} color="#FFD600" />
        <span className="text-sm font-medium text-text-primary">
          Выбрано {selectedCount} лидов
        </span>
      </div>
      
      <div className="flex items-center space-x-1">
        {actions?.map((action) => (
          <button
            key={action?.key}
            onClick={() => onBulkAction(action?.key)}
            className={`px-3 py-1 text-sm font-medium rounded-lg nav-transition flex items-center space-x-1 ${action?.color}`}
          >
            <Icon name={action?.icon} size={14} />
            <span>{action?.label}</span>
          </button>
        ))}
        
        <div className="w-px h-6 bg-border mx-2"></div>
        
        <button
          onClick={() => onBulkAction('clear_selection')}
          className="px-2 py-1 text-sm text-text-secondary hover:text-text-primary nav-transition"
        >
          <Icon name="X" size={14} />
        </button>
      </div>
    </div>
  );
};

export default BulkActionsBar;