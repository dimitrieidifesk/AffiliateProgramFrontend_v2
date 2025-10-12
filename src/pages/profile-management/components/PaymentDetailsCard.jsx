import React from 'react';
import Icon from 'components/AppIcon';

const PaymentDetailsCard = ({ user, onEditPayment }) => {
  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-card hover:shadow-card-hover nav-transition">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-heading font-semibold text-text-primary flex items-center">
          <Icon name="CreditCard" size={20} color="#FFD600" className="mr-2" />
          Платежные реквизиты
        </h3>
        <button
          onClick={onEditPayment}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg nav-transition border border-yellow-200"
        >
          <Icon name="Edit2" size={14} color="#B45309" />
          <span>Редактировать</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Банк</label>
              <p className="text-sm font-medium text-text-primary">{user?.bank || 'Не указано'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Реквизиты</label>
              <p className="text-sm font-mono text-text-primary break-all">{user?.requisites || 'Не указано'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-text-secondary mb-1">Комментарий</label>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{user?.requisites_comment || '—'}</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start space-x-2">
            <Icon name="Info" size={16} color="#D97706" className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-700">Важно</p>
              <p className="text-xs text-yellow-600 mt-1">
                Реквизиты используются для выплат. Убедитесь, что данные указаны корректно.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsCard;