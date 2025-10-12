import React from 'react';
import { User, AtSign } from 'lucide-react';

const PersonalInfoForm = ({ formData, errors, onChange }) => {
  return (
    <>
      {/* ФИО Field */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
          ФИО <span className="text-error">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="w-4 h-4 text-text-secondary" />
          </div>
          <input
            id="fullName"
            type="text"
            value={formData?.fullName}
            onChange={(e) => onChange('fullName', e?.target?.value)}
            className={`block w-full pl-10 pr-4 py-3 border rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
              errors?.fullName ? 'border-error bg-error-50' : 'border-border bg-background'
            }`}
            placeholder="Введите ваше полное имя"
          />
        </div>
        {errors?.fullName && (
          <p className="mt-1 text-sm text-error flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors?.fullName}</span>
          </p>
        )}
      </div>
      {/* Логин Field */}
      <div>
        <label htmlFor="login" className="block text-sm font-medium text-text-primary mb-2">
          Логин <span className="text-error">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <AtSign className="w-4 h-4 text-text-secondary" />
          </div>
          <input
            id="login"
            type="text"
            value={formData?.login}
            onChange={(e) => onChange('login', e?.target?.value)}
            className={`block w-full pl-10 pr-4 py-3 border rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
              errors?.login ? 'border-error bg-error-50' : 'border-border bg-background'
            }`}
            placeholder="Введите логин"
          />
        </div>
        {errors?.login && (
          <p className="mt-1 text-sm text-error flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors?.login}</span>
          </p>
        )}
      </div>
    </>
  );
};

export default PersonalInfoForm;