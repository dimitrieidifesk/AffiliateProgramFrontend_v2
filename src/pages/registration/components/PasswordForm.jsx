import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const PasswordForm = ({ 
  formData, 
  errors, 
  onChange, 
  showPassword, 
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword 
}) => {
  return (
    <>
      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
          Пароль <span className="text-error">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="w-4 h-4 text-text-secondary" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData?.password}
            onChange={(e) => onChange('password', e?.target?.value)}
            className={`block w-full pl-10 pr-10 py-3 border rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
              errors?.password ? 'border-error bg-error-50' : 'border-border bg-background'
            }`}
            placeholder="Введите пароль"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-yellow-primary nav-transition"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-text-secondary" />
            ) : (
              <Eye className="w-4 h-4 text-text-secondary" />
            )}
          </button>
        </div>
        {errors?.password && (
          <p className="mt-1 text-sm text-error flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors?.password}</span>
          </p>
        )}
      </div>
      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
          Повторите пароль <span className="text-error">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="w-4 h-4 text-text-secondary" />
          </div>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData?.confirmPassword}
            onChange={(e) => onChange('confirmPassword', e?.target?.value)}
            className={`block w-full pl-10 pr-10 py-3 border rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
              errors?.confirmPassword ? 'border-error bg-error-50' : 'border-border bg-background'
            }`}
            placeholder="Повторите пароль"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-yellow-primary nav-transition"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4 text-text-secondary" />
            ) : (
              <Eye className="w-4 h-4 text-text-secondary" />
            )}
          </button>
        </div>
        {errors?.confirmPassword && (
          <p className="mt-1 text-sm text-error flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors?.confirmPassword}</span>
          </p>
        )}
      </div>
    </>
  );
};

export default PasswordForm;