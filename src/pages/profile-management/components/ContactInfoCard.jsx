import React, { useState } from 'react';
import Icon from 'components/AppIcon';

const ContactInfoCard = ({
  user,
  onUpdateEmail,
  onUpdatePhone,
  savingEmail = false,
  savingPhone = false,
  errorEmail = '',
  errorPhone = '',
}) => {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneForm, setPhoneForm] = useState({ newPhone: '', password: '' });
  const handleEmailChange = () => setIsEditingEmail(true);

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-card hover:shadow-card-hover nav-transition">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-heading font-semibold text-text-primary flex items-center">
          <Icon name="Mail" size={20} color="#FFD600" className="mr-2" />
          Контактная информация
        </h3>
      </div>
      <div className="space-y-4">
        {/* Email Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-secondary">Электронная почта</label>
          </div>
          
          {isEditingEmail ? (
            <div className="space-y-3">
              <input
                type="email"
                value={emailForm?.newEmail}
                onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e?.target?.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-yellow-primary focus:outline-none"
                placeholder="Новый email адрес"
              />
              <input
                type="password"
                value={emailForm?.password}
                onChange={(e) => setEmailForm(prev => ({ ...prev, password: e?.target?.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-yellow-primary focus:outline-none"
                placeholder="Подтвердите паролем"
              />
              {errorEmail ? (
                <div className="text-sm text-red-600">{errorEmail}</div>
              ) : null}
              <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    if (!onUpdateEmail) return;
                    const ok = await onUpdateEmail({ newEmail: emailForm.newEmail, password: emailForm.password });
                    if (ok) { setIsEditingEmail(false); setEmailForm({ newEmail: '', password: '' }); }
                  }}
                  disabled={savingEmail}
                  className="px-3 py-1 bg-yellow-500 text-black text-sm rounded hover:bg-yellow-600 nav-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingEmail ? 'Сохранение…' : 'Изменить'}
                </button>
                <button
                  onClick={() => { setIsEditingEmail(false); setEmailForm({ newEmail: '', password: '' }); }}
                  disabled={savingEmail}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200 nav-transition"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-text-primary font-medium">{user?.email}</p>
              <button
                onClick={handleEmailChange}
                className="text-sm text-yellow-600 hover:text-yellow-700 nav-transition flex items-center"
              >
                <Icon name="Edit2" size={12} color="#CA8A04" className="mr-1" />
                Изменить
              </button>
            </div>
          )}
        </div>

        {/* Phone Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-secondary">Номер телефона</label>
          </div>
          
          {isEditingPhone ? (
            <div className="space-y-3">
              <input
                type="text"
                value={phoneForm?.newPhone}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, newPhone: e?.target?.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-yellow-primary focus:outline-none"
                placeholder="Новый номер телефона"
              />
              <input
                type="password"
                value={phoneForm?.password}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, password: e?.target?.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-yellow-primary focus:outline-none"
                placeholder="Подтвердите паролем"
              />
              {errorPhone ? (
                <div className="text-sm text-red-600">{errorPhone}</div>
              ) : null}
              <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    if (!onUpdatePhone) return;
                    const ok = await onUpdatePhone({ newPhone: phoneForm.newPhone, password: phoneForm.password });
                    if (ok) { setIsEditingPhone(false); setPhoneForm({ newPhone: '', password: '' }); }
                  }}
                  disabled={savingPhone}
                  className="px-3 py-1 bg-yellow-500 text-black text-sm rounded hover:bg-yellow-600 nav-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPhone ? 'Сохранение…' : 'Изменить'}
                </button>
                <button
                  onClick={() => { setIsEditingPhone(false); setPhoneForm({ newPhone: '', password: '' }); }}
                  disabled={savingPhone}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200 nav-transition"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-text-primary font-medium">{user?.phone}</p>
              <button
                onClick={() => setIsEditingPhone(true)}
                className="text-sm text-yellow-600 hover:text-yellow-700 nav-transition flex items-center"
              >
                <Icon name="Edit2" size={12} color="#CA8A04" className="mr-1" />
                Изменить
              </button>
            </div>
          )}
        </div>

        {/* Registration Date */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-text-secondary">Дата регистрации</label>
              <p className="text-text-primary font-medium">{user?.registrationDate}</p>
            </div>
            <Icon name="Calendar" size={20} color="#9CA3AF" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoCard;