import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/ui/Header';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';

// Components
import PersonalInfoCard from './components/PersonalInfoCard';
import ContactInfoCard from './components/ContactInfoCard';
import PasswordChangeCard from './components/PasswordChangeCard';
import PaymentDetailsCard from './components/PaymentDetailsCard';
import LogoutCard from './components/LogoutCard';
import ChangePasswordModal from './components/ChangePasswordModal';
import EditPaymentModal from './components/EditPaymentModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import http from 'services/http';
import { getCurrentUserId, persistUserProfile, clearStoredUser } from 'utils/auth';
import { fetchUserProfile } from 'services/users';

const ProfileManagement = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState('webmaster');
  const [userId, setUserId] = useState(() => getCurrentUserId());
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [animationClass, setAnimationClass] = useState('');

  // Enhanced animation effects
  useEffect(() => {
    setAnimationClass('animate-fade-in');
  }, []);

  // Fetch user profile; resolve current user via token if no stored id
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setLoadError('');
      try {
        let effectiveId = userId;
        if (!effectiveId) {
          // Ask backend to resolve current user by access token
          const user = await fetchUserProfile('00000', { navigate });
          if (user && user.id) {
            persistUserProfile(user);
            effectiveId = String(user.id);
            setUserId(effectiveId);
            setUserRole(user?.role || 'webmaster');
            setProfile(user);
            return; // already set from resolved user
          }
        }
        // Fetch by known id
        const res = await http.get(`/api/v2/users/${effectiveId}?with_requisites=true`, { navigate });
        if (!res.ok) throw new Error('Load failed');
        const u = res.data;
        setProfile(u);
        setUserRole(u?.role || 'webmaster');
      } catch (e) {
        setLoadError('Не удалось загрузить профиль');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handlePasswordChange = () => {
    setShowPasswordModal(true);
  };

  const handlePaymentEdit = () => {
    setShowPaymentModal(true);
  };

  const savingPayment = false;
  const [savingPaymentState, setSavingPaymentState] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const handleSavePayment = async (payload) => {
    setPaymentError('');
    setSavingPaymentState(true);
    try {
  const res = await http.patch(`/api/v2/users/${userId}`, payload, { navigate });
      if (!res.ok) throw new Error('PATCH failed');
      // refresh profile
  const refreshed = await http.get(`/api/v2/users/${userId}?with_requisites=true`, { navigate });
      if (refreshed.ok) setProfile(refreshed.data);
      setShowPaymentModal(false);
    } catch (e) {
      setPaymentError('Не удалось сохранить реквизиты');
    } finally {
      setSavingPaymentState(false);
    }
  };

  // Change password flow
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const handleConfirmChangePassword = async ({ currentPassword, newPassword }) => {
    setPasswordError('');
    setSavingPassword(true);
    try {
      // Verify current password using known login
      const verified = await verifyPassword(currentPassword);
      if (!verified) { setPasswordError('Неверный текущий пароль'); return false; }
      // PATCH new password
      const res = await http.patch(`/api/v2/users/${userId}`, { password: newPassword }, { navigate });
      if (!res.ok) { setPasswordError('Не удалось изменить пароль'); return false; }
      setShowPasswordModal(false);
      return true;
    } finally {
      setSavingPassword(false);
    }
  };

  // Email/Phone update flow with password confirmation via login
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPhone, setErrorPhone] = useState('');

  const verifyPassword = async (password) => {
    try {
      const body = { login: profile?.login, password };
  const res = await http.post('/api/v2/auth/login', body, { navigate });
      return !!res?.ok;
    } catch (e) {
      return false;
    }
  };

  const handleUpdateEmail = async ({ newEmail, password }) => {
    setErrorEmail('');
    if (!newEmail?.trim()) { setErrorEmail('Укажите новый email'); return false; }
    setSavingEmail(true);
    try {
      const verified = await verifyPassword(password);
      if (!verified) { setErrorEmail('Неверный пароль'); return false; }
      const res = await http.patch(`/api/v2/users/${userId}`, { email: newEmail }, { navigate });
      if (!res.ok) { setErrorEmail('Не удалось сохранить email'); return false; }
      const refreshed = await http.get(`/api/v2/users/${userId}?with_requisites=true`, { navigate });
      if (refreshed.ok) setProfile(refreshed.data);
      return true;
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUpdatePhone = async ({ newPhone, password }) => {
    setErrorPhone('');
    if (!newPhone?.trim()) { setErrorPhone('Укажите новый номер'); return false; }
    setSavingPhone(true);
    try {
      const verified = await verifyPassword(password);
      if (!verified) { setErrorPhone('Неверный пароль'); return false; }
      const res = await http.patch(`/api/v2/users/${userId}`, { phone: newPhone }, { navigate });
      if (!res.ok) { setErrorPhone('Не удалось сохранить номер'); return false; }
      const refreshed = await http.get(`/api/v2/users/${userId}?with_requisites=true`, { navigate });
      if (refreshed.ok) setProfile(refreshed.data);
      return true;
    } finally {
      setSavingPhone(false);
    }
  };

  const handleLogout = () => {
    setLogoutError('');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError('');
    try {
  const res = await http.post('/api/v2/auth/logout', null, { navigate });
      if (res.ok) {
        // Удаляем локальные данные пользователя
        clearStoredUser();
        // На бэке желательно очистить куки. Здесь просто уходим на логин.
        navigate('/login', { replace: true });
      } else {
        const msg = typeof res.data === 'string' ? res.data : (res.data?.message || res.data?.error) || 'Не удалось выйти из аккаунта';
        setLogoutError(msg);
      }
    } catch (e) {
      setLogoutError('Ошибка сети. Повторите попытку.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Enhanced yellow decorative figures for profile page
  const YellowFigures = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Original figures */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-yellow-primary opacity-5 rounded-full animate-float"></div>
      <div className="absolute bottom-20 left-10 w-24 h-24 bg-black opacity-5 rounded-full animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-primary opacity-3 rounded-full animate-pulse"></div>
      
      {/* Additional figures for top area */}
      <div className="absolute top-12 right-32 w-8 h-8 bg-yellow-400 rounded-full opacity-15 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
      <div className="absolute top-28 right-48 w-6 h-6 bg-yellow-300 transform rotate-45 opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-16 right-64 w-10 h-4 bg-yellow-500 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
      <div className="absolute top-44 right-24 w-3 h-8 bg-yellow-300 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute top-36 right-80 w-5 h-5 bg-yellow-400 opacity-20 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '5s' }}></div>
      <div className="absolute top-52 right-16 w-7 h-12 bg-yellow-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2.5s' }}></div>
      <div className="absolute top-8 right-96 w-9 h-9 bg-yellow-300 transform rotate-12 opacity-15 animate-bounce" style={{ animationDelay: '3s', animationDuration: '6s' }}></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-leadmaker-pattern relative overflow-hidden">
      <YellowFigures />

      <Header 
        user={profile} 
        onMenuToggle={handleSidebarToggle}
        sidebarCollapsed={sidebarCollapsed}
      />
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        userRole={userRole}
      />
      <main className={`
        pt-header-height nav-transition relative z-10
        ${sidebarCollapsed ? 'lg:ml-sidebar-collapsed' : 'lg:ml-sidebar-width'}
      `}>
        <div className="p-4 w-full max-w-6xl mx-auto">
          {/* Enhanced Page Header */}
          <div className={`mb-6 ${animationClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center">
                  <Icon name="User" size={28} color="#FFD600" className="mr-3" />
                  Управление профилем
                </h1>
                {loadError ? (
                  <p className="text-error text-base">{loadError}</p>
                ) : (
                  <p className="text-text-secondary text-base">
                    Управляйте настройками вашего аккаунта и персональными данными
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {profile?.verified_status ? (
                  <div className={`flex items-center space-x-1 px-3 py-2 rounded-lg border ${
                    profile?.verified_status === 'verified' ? 'bg-green-50 border-green-200' : profile?.verified_status === 'under_review' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      profile?.verified_status === 'verified' ? 'bg-green-500' : profile?.verified_status === 'under_review' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      profile?.verified_status === 'verified' ? 'text-green-700' : profile?.verified_status === 'under_review' ? 'text-yellow-700' : 'text-gray-700'
                    }`}>
                      {profile?.verified_status === 'verified' ? 'Верифицирован' : profile?.verified_status === 'under_review' ? 'На проверке' : 'Не верифицирован'}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <PersonalInfoCard
                user={{
                  full_name: profile?.full_name || '',
                  role: profile?.role === 'advertiser' ? 'Рекламодатель' : profile?.role === 'webmaster' ? 'Вебмастер' : profile?.role || '',
                  avatar: null,
                }}
                saving={false}
                onSaveFullName={async (newFullName) => {
                  try {
                    const res = await http.patch(`/api/v2/users/${userId}`, { full_name: newFullName }, { navigate });
                    if (res.ok) {
                      const refreshed = await http.get(`/api/v2/users/${userId}?with_requisites=true`, { navigate });
                      if (refreshed.ok) setProfile(refreshed.data);
                    }
                  } catch (e) {
                    // optionally show toast or inline error
                  }
                }}
              />

              {/* Contact Information */}
              <ContactInfoCard
                user={{
                  email: profile?.email,
                  phone: profile?.phone,
                  registrationDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : '',
                }}
                onUpdateEmail={handleUpdateEmail}
                onUpdatePhone={handleUpdatePhone}
                savingEmail={savingEmail}
                savingPhone={savingPhone}
                errorEmail={errorEmail}
                errorPhone={errorPhone}
              />

              {/* Payment Details */}
              <PaymentDetailsCard 
                user={{
                  bank: profile?.bank,
                  requisites: profile?.requisites,
                  requisites_comment: profile?.requisites_comment,
                }} 
                onEditPayment={handlePaymentEdit}
              />
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              {/* Password Change */}
              <PasswordChangeCard onChangePassword={handlePasswordChange} />

              {/* Logout */}
              <LogoutCard onLogout={handleLogout} />

              {/* Account Summary */}
              <div className="bg-surface rounded-lg border border-border p-4 shadow-card">
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-3 flex items-center">
                  <Icon name="Calendar" size={18} color="#FFD600" className="mr-2" />
                  Информация об аккаунте
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Дата регистрации:</span>
                    <span className="text-sm font-medium text-text-primary">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Статус аккаунта:</span>
                    {profile?.verified_status ? (
                      <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                        profile?.verified_status === 'verified' ? 'bg-green-100 text-green-800' : profile?.verified_status === 'under_review' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profile?.verified_status === 'verified' ? 'Верифицирован' : profile?.verified_status === 'under_review' ? 'На проверке' : 'Не верифицирован'}
                      </span>
                    ) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showPasswordModal && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          saving={savingPassword}
          error={passwordError}
          onConfirm={handleConfirmChangePassword}
        />
      )}

      {showPaymentModal && (
        <EditPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          initialValues={{
            bank: profile?.bank,
            requisites: profile?.requisites,
            requisites_comment: profile?.requisites_comment,
          }}
          onSave={handleSavePayment}
          saving={savingPaymentState}
        />
      )}

      {showLogoutModal && (
        <LogoutConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
          isProcessing={isLoggingOut}
          error={logoutError}
        />
      )}
    </div>
  );
};

export default ProfileManagement;