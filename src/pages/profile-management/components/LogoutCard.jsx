import React from 'react';
import Icon from 'components/AppIcon';

const LogoutCard = ({ onLogout }) => {
  return (
    <div className="bg-surface rounded-lg border border-border p-4 shadow-card hover:shadow-card-hover nav-transition">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-3 flex items-center">
        <Icon name="LogOut" size={18} color="#FFD600" className="mr-2" />
        Выход из аккаунта
      </h3>
      
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Завершите работу с аккаунтом безопасно. После выхода вам потребуется ввести логин и пароль для повторного входа.
        </p>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg nav-transition font-medium transform hover:scale-105 active:scale-95"
        >
          <Icon name="LogOut" size={16} color="#FFFFFF" />
          <span>Выйти из аккаунта</span>
        </button>

        
      </div>
    </div>
  );
};

export default LogoutCard;