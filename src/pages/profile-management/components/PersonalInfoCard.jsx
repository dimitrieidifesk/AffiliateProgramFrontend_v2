import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const PersonalInfoCard = ({ user, onSaveFullName, saving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [errors, setErrors] = useState({});

  const handleInputChange = (value) => {
    setFullName(value);
    if (errors.full_name) setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!fullName?.trim()) newErrors.full_name = 'Имя обязательно для заполнения';
    else if (fullName.trim().length < 2) newErrors.full_name = 'Имя должно содержать минимум 2 символа';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    await onSaveFullName?.(fullName);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFullName(user?.full_name || '');
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-card hover:shadow-card-hover nav-transition">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-heading font-semibold text-text-primary flex items-center">
          <Icon name="User" size={20} color="#FFD600" className="mr-2" />
          Личная информация
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg nav-transition border border-yellow-200"
          >
            <Icon name="Edit2" size={14} color="#B45309" />
            <span>Редактировать</span>
          </button>
        )}
      </div>
      <div className="flex items-center space-x-4 mb-6">
        {/* Avatar */}
        <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-card">
          {user?.avatar ? (
            <img 
              src={user?.avatar} 
              alt={user?.full_name || 'User Avatar'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-white">
              {(user?.full_name || 'U')?.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <h4 className="text-lg font-semibold text-text-primary">
            {user?.full_name || '—'}
          </h4>
          <p className="text-sm text-text-secondary">{user?.role}</p>
        </div>
      </div>
      {isEditing ? (
        <div className="space-y-4">
          {/* Full Name Field */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Имя *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => handleInputChange(e?.target?.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg nav-transition focus:outline-none ${
                errors?.full_name 
                  ? 'border-red-300 focus:border-red-500 bg-red-50' :'border-border focus:border-yellow-primary bg-surface'
              } text-text-primary`}
              placeholder="Введите ваше имя"
            />
            {errors?.full_name && (
              <p className="text-red-600 text-xs mt-1 flex items-center">
                <Icon name="AlertCircle" size={12} color="#DC2626" className="mr-1" />
                {errors?.full_name}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-lg hover:shadow-card-hover nav-transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="Save" size={14} color="#000000" />
              <span>{saving ? 'Сохранение…' : 'Сохранить'}</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg nav-transition"
            >
              <Icon name="X" size={14} color="#4B5563" />
              <span>Отмена</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Имя</label>
            <p className="text-text-primary font-medium">{user?.full_name || 'Не указано'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoCard;