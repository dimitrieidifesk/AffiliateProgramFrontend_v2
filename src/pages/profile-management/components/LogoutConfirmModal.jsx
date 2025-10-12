import React from 'react';
import Icon from 'components/AppIcon';

const LogoutConfirmModal = ({ isOpen, onClose, onConfirm, isProcessing, error }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-heading font-semibold text-text-primary flex items-center">
            <Icon name="LogOut" size={20} color="#FFD600" className="mr-2" />
            Подтверждение выхода
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded nav-transition" aria-label="Закрыть">
            <Icon name="X" size={20} color="#6B7280" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-text-secondary">
            Вы действительно хотите выйти из аккаунта? После выхода для входа потребуется логин и пароль.
          </p>
          {error ? (
            <div className="text-sm text-error bg-error-50 border border-error/20 rounded-lg p-3">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg nav-transition font-medium flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Выходим…</span>
              </>
            ) : (
              <>
                <Icon name="LogOut" size={16} color="#FFFFFF" />
                <span>Выйти</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg nav-transition"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
