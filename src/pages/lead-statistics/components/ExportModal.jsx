import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const ExportModal = ({ onExport, onClose, selectedCount, totalCount }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportScope, setExportScope] = useState(selectedCount > 0 ? 'selected' : 'filtered');
  const [includeFields, setIncludeFields] = useState({
    basic: true,
    contact: true,
    financial: true,
    notes: false
  });

  const handleExport = () => {
    const exportData = {
      format: exportFormat,
      scope: exportScope,
      fields: includeFields
    };
    onExport(exportData);
  };

  const formats = [
    { key: 'csv', label: 'CSV', description: 'Для Excel и Google Sheets', icon: 'FileText' },
    { key: 'excel', label: 'Excel', description: 'Готовая таблица .xlsx', icon: 'FileSpreadsheet' },
    { key: 'pdf', label: 'PDF', description: 'Для печати и архива', icon: 'File' }
  ];

  const fieldGroups = [
    { key: 'basic', label: 'Основные данные', description: 'Дата, источник, статус' },
    { key: 'contact', label: 'Контактные данные', description: 'Клиент, телефон, город' },
    { key: 'financial', label: 'Финансовые данные', description: 'Сумма, комиссия' },
    { key: 'notes', label: 'Дополнительно', description: 'Заметки, качество' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-card max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <Icon name="Download" size={20} color="#FFD600" />
            <h3 className="text-lg font-semibold text-text-primary">Экспорт лидов</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 nav-transition"
          >
            <Icon name="X" size={20} color="#757575" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Export Scope */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Объем данных</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="selected"
                  checked={exportScope === 'selected'}
                  onChange={(e) => setExportScope(e?.target?.value)}
                  disabled={selectedCount === 0}
                  className="w-4 h-4 text-yellow-primary border-border focus:ring-yellow-primary"
                />
                <span className={`text-sm ${selectedCount === 0 ? 'text-text-secondary' : 'text-text-primary'}`}>
                  Выбранные лиды ({selectedCount})
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="filtered"
                  checked={exportScope === 'filtered'}
                  onChange={(e) => setExportScope(e?.target?.value)}
                  className="w-4 h-4 text-yellow-primary border-border focus:ring-yellow-primary"
                />
                <span className="text-sm text-text-primary">
                  Все отфильтрованные лиды ({totalCount})
                </span>
              </label>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Формат файла</h4>
            <div className="grid grid-cols-1 gap-2">
              {formats?.map((format) => (
                <label
                  key={format?.key}
                  className={`
                    flex items-center space-x-3 p-3 border rounded-lg cursor-pointer nav-transition
                    ${exportFormat === format?.key 
                      ? 'border-yellow-primary bg-yellow-50' :'border-border hover:border-yellow-primary hover:bg-yellow-25'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format?.key}
                    checked={exportFormat === format?.key}
                    onChange={(e) => setExportFormat(e?.target?.value)}
                    className="w-4 h-4 text-yellow-primary border-border focus:ring-yellow-primary"
                  />
                  <Icon name={format?.icon} size={16} color="#FFD600" />
                  <div>
                    <div className="text-sm font-medium text-text-primary">{format?.label}</div>
                    <div className="text-xs text-text-secondary">{format?.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Включить поля</h4>
            <div className="space-y-2">
              {fieldGroups?.map((group) => (
                <label
                  key={group?.key}
                  className="flex items-start space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={includeFields?.[group?.key]}
                    onChange={(e) => setIncludeFields({
                      ...includeFields,
                      [group?.key]: e?.target?.checked
                    })}
                    className="w-4 h-4 text-yellow-primary border-border rounded focus:ring-yellow-primary mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-text-primary">{group?.label}</div>
                    <div className="text-xs text-text-secondary">{group?.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* File Preview */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Info" size={14} color="#757575" />
              <span className="text-sm font-medium text-text-secondary">Предварительный просмотр</span>
            </div>
            <div className="text-sm text-text-secondary">
              <div>Формат: <span className="font-medium text-text-primary">{formats?.find(f => f?.key === exportFormat)?.label}</span></div>
              <div>Записей: <span className="font-medium text-text-primary">
                {exportScope === 'selected' ? selectedCount : totalCount}
              </span></div>
              <div>Поля: <span className="font-medium text-text-primary">
                {Object.values(includeFields)?.filter(Boolean)?.length} групп
              </span></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-gray-50 nav-transition"
          >
            Отмена
          </button>
          <button
            onClick={handleExport}
            className="gradient-secondary text-black px-4 py-2 rounded-lg hover:shadow-card-hover nav-transition flex items-center space-x-2 font-medium transform hover:scale-105 active:scale-95"
          >
            <Icon name="Download" size={14} color="#000000" />
            <span>Экспортировать</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;