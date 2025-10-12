import React from 'react';
import { Mail, Phone, MessageCircle } from 'lucide-react';

const ContactInfoForm = ({ formData, errors, onChange }) => {
  return (
    <>
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
          Email <span className="text-error">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="w-4 h-4 text-text-secondary" />
          </div>
          <input
            id="email"
            type="email"
            value={formData?.email}
            onChange={(e) => onChange('email', e?.target?.value)}
            className={`block w-full pl-10 pr-4 py-3 border rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
              errors?.email ? 'border-error bg-error-50' : 'border-border bg-background'
            }`}
            placeholder="Введите ваш email"
          />
        </div>
        {!errors?.email && (
          <p className="mt-1 text-xs text-text-muted">
            Мы никогда не передадим вашу электронную почту кому-либо еще
          </p>
        )}
        {errors?.email && (
          <p className="mt-1 text-sm text-error flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors?.email}</span>
          </p>
        )}
      </div>
      {/* Phone Field */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
          Ваш контактный телефон <span className="text-error">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="w-4 h-4 text-text-secondary" />
          </div>
          <input
            id="phone"
            type="tel"
            value={formData?.phone}
            onChange={(e) => onChange('phone', e?.target?.value)}
            className={`block w-full pl-10 pr-4 py-3 border rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition ${
              errors?.phone ? 'border-error bg-error-50' : 'border-border bg-background'
            }`}
            placeholder="+7 (XXX) XXX-XX-XX"
          />
        </div>
        {errors?.phone && (
          <p className="mt-1 text-sm text-error flex items-center space-x-1">
            <span>⚠️</span>
            <span>{errors?.phone}</span>
          </p>
        )}
      </div>
      {/* Telegram Nick Field */}
      <div>
        <label htmlFor="telegramNick" className="block text-sm font-medium text-text-primary mb-2">
          Ник Telegram
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MessageCircle className="w-4 h-4 text-text-secondary" />
          </div>
          <input
            id="telegramNick"
            type="text"
            value={formData?.telegramNick}
            onChange={(e) => onChange('telegramNick', e?.target?.value)}
            className="block w-full pl-10 pr-4 py-3 border border-border bg-background rounded-lg placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-yellow-primary focus:border-transparent nav-transition"
            placeholder="@username"
          />
        </div>
      </div>
    </>
  );
};

export default ContactInfoForm;