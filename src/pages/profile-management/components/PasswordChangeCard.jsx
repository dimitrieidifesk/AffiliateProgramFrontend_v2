import React from 'react';
import Icon from 'components/AppIcon';

const PasswordChangeCard = ({ onChangePassword }) => {
  return (
    <div className="bg-surface rounded-lg border border-border p-4 shadow-card hover:shadow-card-hover nav-transition">
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-3 flex items-center">
        <Icon name="Lock" size={18} color="#FFD600" className="mr-2" />
        Безопасность
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-text-primary">Пароль</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">••••••••••</p>
          </div>
        </div>

        <button
          onClick={onChangePassword}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-lg hover:shadow-card-hover nav-transition font-medium"
        >
          <Icon name="Key" size={16} color="#000000" />
          <span>Изменить пароль</span>
        </button>
      </div>
    </div>
  );
};

export default PasswordChangeCard;