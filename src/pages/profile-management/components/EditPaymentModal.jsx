import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';

// Simple modal to edit bank requisites fields only
const EditPaymentModal = ({ isOpen, onClose, initialValues, onSave, saving }) => {
  const [form, setForm] = useState({ bank: '', requisites: '', requisites_comment: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        bank: initialValues?.bank || '',
        requisites: initialValues?.requisites || '',
        requisites_comment: initialValues?.requisites_comment || ''
      });
      setErrors({});
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const setField = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.requisites?.trim()) e.requisites = 'Укажите реквизиты (карта или телефон)';
    return e;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const e1 = validate();
    setErrors(e1);
    if (Object.keys(e1).length === 0) {
      onSave?.({
        bank: form.bank || null,
        requisites: form.requisites || null,
        requisites_comment: form.requisites_comment || null,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-text-primary flex items-center">
            <Icon name="CreditCard" size={20} color="#FFD600" className="mr-2" />
            Редактировать реквизиты
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded nav-transition">
            <Icon name="X" size={20} color="#6B7280" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Банк</label>
            <input
              type="text"
              value={form.bank}
              onChange={(e) => setField('bank', e.target.value)}
              className="w-full px-3 py-2 border-2 rounded-lg nav-transition focus:outline-none border-gray-300 focus:border-yellow-primary"
              placeholder="Например: Сбербанк"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Реквизиты *</label>
            <input
              type="text"
              value={form.requisites}
              onChange={(e) => setField('requisites', e.target.value)}
              className={`w-full px-3 py-2 border-2 rounded-lg nav-transition focus:outline-none ${errors.requisites ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-yellow-primary'}`}
              placeholder="Номер карты или телефона"
            />
            {errors.requisites ? (
              <p className="text-xs text-red-600 mt-1">{errors.requisites}</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Комментарий</label>
            <textarea
              value={form.requisites_comment}
              onChange={(e) => setField('requisites_comment', e.target.value)}
              className="w-full px-3 py-2 border-2 rounded-lg nav-transition focus:outline-none border-gray-300 focus:border-yellow-primary"
              rows={3}
              placeholder="Например: карта на имя ..."
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-3 rounded-lg hover:shadow-card-hover nav-transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg nav-transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPaymentModal;