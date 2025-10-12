import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const ChangePasswordModal = ({ isOpen, onClose, onConfirm, saving = false, error = '' }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  if (!isOpen) return null;

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password?.length >= 8) strength += 1;
    if (/[A-Z]/?.test(password)) strength += 1;
    if (/[a-z]/?.test(password)) strength += 1;
    if (/\d/?.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/?.test(password)) strength += 1;
    return strength;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Clear errors when typing
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev?.[field] }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData?.currentPassword) {
      newErrors.currentPassword = 'Введите текущий пароль';
    }
    
    if (!formData?.newPassword) {
      newErrors.newPassword = 'Введите новый пароль';
    } else if (formData?.newPassword?.length < 8) {
      newErrors.newPassword = 'Пароль должен содержать минимум 8 символов';
    }
    
    if (!formData?.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите новый пароль';
    } else if (formData?.newPassword !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    if (formData?.currentPassword === formData?.newPassword) {
      newErrors.newPassword = 'Новый пароль должен отличаться от текущего';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;
    const ok = await onConfirm?.({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
    if (ok) onClose();
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return 'Слабый';
      case 2:
        return 'Средний';
      case 3:
        return 'Хороший';
      case 4:
      case 5:
        return 'Отличный';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-text-primary flex items-center">
            <Icon name="Lock" size={20} color="#FFD600" className="mr-2" />
            Изменить пароль
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded nav-transition"
          >
            <Icon name="X" size={20} color="#6B7280" />
          </button>
        </div>

  <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Текущий пароль *
            </label>
            <div className="relative">
              <input
                type={showPasswords?.current ? 'text' : 'password'}
                value={formData?.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e?.target?.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg nav-transition focus:outline-none pr-10 ${
                  errors?.currentPassword 
                    ? 'border-red-300 focus:border-red-500' :'border-gray-300 focus:border-yellow-primary'
                }`}
                placeholder="Введите текущий пароль"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <Icon 
                  name={showPasswords?.current ? 'EyeOff' : 'Eye'} 
                  size={16} 
                  color="#9CA3AF" 
                />
              </button>
            </div>
            {errors?.currentPassword && (
              <p className="text-red-600 text-xs mt-1">{errors?.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Новый пароль *
            </label>
            <div className="relative">
              <input
                type={showPasswords?.new ? 'text' : 'password'}
                value={formData?.newPassword}
                onChange={(e) => handleInputChange('newPassword', e?.target?.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg nav-transition focus:outline-none pr-10 ${
                  errors?.newPassword 
                    ? 'border-red-300 focus:border-red-500' :'border-gray-300 focus:border-yellow-primary'
                }`}
                placeholder="Введите новый пароль"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <Icon 
                  name={showPasswords?.new ? 'EyeOff' : 'Eye'} 
                  size={16} 
                  color="#9CA3AF" 
                />
              </button>
            </div>
            {errors?.newPassword && (
              <p className="text-red-600 text-xs mt-1">{errors?.newPassword}</p>
            )}

            {/* Password Strength Indicator */}
            {formData?.newPassword && (
              <div className="mt-2">
                <div className="flex space-x-1 mb-1">
                  {[1, 2, 3, 4, 5]?.map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength 
                          ? getStrengthColor(passwordStrength)
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600">
                  Сила пароля: <span className="font-medium">{getStrengthText(passwordStrength)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Подтвердите новый пароль *
            </label>
            <div className="relative">
              <input
                type={showPasswords?.confirm ? 'text' : 'password'}
                value={formData?.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg nav-transition focus:outline-none pr-10 ${
                  errors?.confirmPassword 
                    ? 'border-red-300 focus:border-red-500' :'border-gray-300 focus:border-yellow-primary'
                }`}
                placeholder="Повторите новый пароль"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <Icon 
                  name={showPasswords?.confirm ? 'EyeOff' : 'Eye'} 
                  size={16} 
                  color="#9CA3AF" 
                />
              </button>
            </div>
            {errors?.confirmPassword && (
              <p className="text-red-600 text-xs mt-1">{errors?.confirmPassword}</p>
            )}
          </div>

          {/* Requirements */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Требования к паролю:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p className={`flex items-center ${formData?.newPassword?.length >= 8 ? 'text-green-600' : ''}`}>
                <Icon 
                  name={formData?.newPassword?.length >= 8 ? 'CheckCircle' : 'Circle'} 
                  size={12} 
                  color={formData?.newPassword?.length >= 8 ? '#16A34A' : '#9CA3AF'} 
                  className="mr-1" 
                />
                Минимум 8 символов
              </p>
              <p className={`flex items-center ${/[A-Z]/?.test(formData?.newPassword) ? 'text-green-600' : ''}`}>
                <Icon 
                  name={/[A-Z]/?.test(formData?.newPassword) ? 'CheckCircle' : 'Circle'} 
                  size={12} 
                  color={/[A-Z]/?.test(formData?.newPassword) ? '#16A34A' : '#9CA3AF'} 
                  className="mr-1" 
                />
                Содержит заглавные буквы
              </p>
              <p className={`flex items-center ${/\d/?.test(formData?.newPassword) ? 'text-green-600' : ''}`}>
                <Icon 
                  name={/\d/?.test(formData?.newPassword) ? 'CheckCircle' : 'Circle'} 
                  size={12} 
                  color={/\d/?.test(formData?.newPassword) ? '#16A34A' : '#9CA3AF'} 
                  className="mr-1" 
                />
                Содержит цифры
              </p>
              <p className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/?.test(formData?.newPassword) ? 'text-green-600' : ''}`}>
                <Icon 
                  name={/[!@#$%^&*(),.?":{}|<>]/?.test(formData?.newPassword) ? 'CheckCircle' : 'Circle'} 
                  size={12} 
                  color={/[!@#$%^&*(),.?":{}|<>]/?.test(formData?.newPassword) ? '#16A34A' : '#9CA3AF'} 
                  className="mr-1" 
                />
                Содержит специальные символы
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            {error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-3 rounded-lg hover:shadow-card-hover nav-transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение…' : 'Изменить пароль'}
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

export default ChangePasswordModal;