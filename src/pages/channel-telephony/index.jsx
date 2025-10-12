import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import http from 'services/http';

const ChannelTelephonySettings = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Yellow decorative figures component
  const YellowFigures = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Upper part figures */}
      <div className="absolute top-16 right-8 w-10 h-10 bg-yellow-200 rounded-full opacity-15 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
      <div className="absolute top-32 right-24 w-8 h-8 bg-yellow-300 transform rotate-45 opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-20 right-40 w-12 h-6 bg-yellow-400 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
      <div className="absolute top-48 right-12 w-4 h-10 bg-yellow-300 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute top-24 right-60 w-5 h-12 bg-yellow-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2.5s' }}></div>
      <div className="absolute top-40 right-80 w-7 h-7 bg-yellow-300 transform rotate-12 opacity-15 animate-bounce" style={{ animationDelay: '3s', animationDuration: '6s' }}></div>
      
      {/* Left side upper figures */}
      <div className="absolute top-24 left-8 w-6 h-6 bg-yellow-400 rounded-full opacity-12 animate-pulse" style={{ animationDelay: '1.2s' }}></div>
      <div className="absolute top-64 left-16 w-9 h-5 bg-yellow-200 rounded-full opacity-18 animate-bounce" style={{ animationDelay: '2.8s', animationDuration: '4.5s' }}></div>
      <div className="absolute top-44 left-32 w-4 h-8 bg-yellow-300 transform rotate-45 opacity-14 animate-pulse" style={{ animationDelay: '0.8s' }}></div>

      {/* Bottom part figures */}
      <div className="absolute bottom-16 right-12 w-8 h-8 bg-yellow-200 rounded-full opacity-12 animate-bounce" style={{ animationDelay: '1.8s', animationDuration: '3.5s' }}></div>
      <div className="absolute bottom-32 right-28 w-10 h-5 bg-yellow-400 rounded-full opacity-16 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
      <div className="absolute bottom-20 right-48 w-6 h-9 bg-yellow-300 transform rotate-12 opacity-14 animate-bounce" style={{ animationDelay: '2.2s', animationDuration: '5.2s' }}></div>
      <div className="absolute bottom-48 right-20 w-5 h-5 bg-yellow-200 opacity-20 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute bottom-24 right-64 w-7 h-11 bg-yellow-400 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '3.5s', animationDuration: '4.8s' }}></div>
      
      {/* Left side bottom figures */}
      <div className="absolute bottom-20 left-10 w-8 h-6 bg-yellow-300 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '2.1s' }}></div>
      <div className="absolute bottom-56 left-24 w-5 h-10 bg-yellow-400 transform rotate-45 opacity-12 animate-bounce" style={{ animationDelay: '0.7s', animationDuration: '3.8s' }}></div>
      <div className="absolute bottom-36 left-40 w-9 h-4 bg-yellow-200 rounded-full opacity-18 animate-pulse" style={{ animationDelay: '2.7s' }}></div>
    </div>
  );

  const [channelData, setChannelData] = useState({
    threadId: id,
    threadName: '',
    status: 'not_connected',
    config: {
      phoneNumber: '',
      connectionDate: null,
      newPhoneNumber: ''
    }
  });

  // Helpers: masking/formatting for RU numbers
  const onlyDigits = (s = '') => (s || '').replace(/\D/g, '');

  // Build "+7 (XXX) XXX-XX-XX" from up to 10 national digits
  const formatDisplayFromNational = (digs = '') => {
    const d = (digs || '').slice(0, 10);
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 8);
    const p4 = d.slice(8, 10);
    let out = '+7 ';
    out += '(' + p1 + (p1.length < 3 ? '' : '') + ')';
    out += (p2.length ? ' ' + p2 : '');
    out += (p3.length ? '-' + p3 : '');
    out += (p4.length ? '-' + p4 : '');
    // Clean up incomplete bracket/space visuals
    if (!p1.length) out = '+7';
    else if (p1.length && !p2.length) out = `+7 (${p1}`;
    else if (p2.length && !p3.length) out = `+7 (${p1}) ${p2}`;
    else if (p3.length && !p4.length) out = `+7 (${p1}) ${p2}-${p3}`;
    else if (p4.length) out = `+7 (${p1}) ${p2}-${p3}-${p4}`;
    return out;
  };

  // From any user-typed string to national 10 digits (drop leading 7/8 if present)
  const toNationalTenDigits = (input = '') => {
    const d = onlyDigits(input);
    if (!d) return '';
    if (d[0] === '7' || d[0] === '8') return d.slice(1, 11);
    return d.slice(0, 10);
  };

  // From backend number like 79691234567 to display "+7 (969) 123-45-67"
  const toDisplayFromBackend = (num) => {
    const d = onlyDigits(num);
    if (!d) return '';
    const national = d[0] === '7' ? d.slice(1) : d;
    return formatDisplayFromNational(national);
  };

  // From display string to backend digits: 7 + 10 national digits
  const toBackendFromDisplay = (display) => {
    const national = toNationalTenDigits(display);
    return national.length === 10 ? '7' + national : null;
  };

  const isValidPhone = (display) => toNationalTenDigits(display).length === 10;

  const mapStatus = (telephonyStatus) => {
    switch (telephonyStatus) {
      case 'connected':
        return 'connected';
      case 'waiting':
        return 'pending';
      case 'error':
        return 'error';
      case 'none':
      default:
        return 'not_connected';
    }
  };

  const fetchThread = async () => {
    if (!id || id === 'new') return;
    setLoadError(null);
    try {
      const res = await http.get(`/api/v2/threads/${id}`);
      if (res.ok && res.data) {
        const t = res.data;
        setChannelData({
          threadId: id,
          threadName: t.title || '',
          status: mapStatus(t.telephony_connect_status),
          config: {
            phoneNumber: toDisplayFromBackend(t.telephony_virtual_phone) || '',
            connectionDate: null,
            newPhoneNumber: ''
          }
        });
      } else {
        setLoadError('Не удалось загрузить данные потока');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load thread', e);
      setLoadError('Ошибка загрузки данных');
    }
  };

  useEffect(() => {
    fetchThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleTelephonyConnect = async () => {
    if (!channelData.config.phoneNumber) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const backendPhone = toBackendFromDisplay(channelData.config.phoneNumber);
      if (!backendPhone) throw new Error('invalid phone');
      const payload = { telephony_virtual_phone: backendPhone };
      const res = await http.patch(`/api/v2/threads/${id}`, payload);
      if (!res.ok) throw new Error('PATCH failed');
      await fetchThread();
    } catch (e) {
      setActionError('Не удалось отправить заявку на подключение');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneNumberChange = (field, value) => {
    const national = toNationalTenDigits(value);
    const display = national ? formatDisplayFromNational(national) : '';
    setChannelData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: display
      }
    }));
  };

  const handleChangePhoneNumber = async () => {
    if (!channelData.config.newPhoneNumber) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const backendPhone = toBackendFromDisplay(channelData.config.newPhoneNumber);
      if (!backendPhone) throw new Error('invalid phone');
      const payload = { telephony_virtual_phone: backendPhone };
      const res = await http.patch(`/api/v2/threads/${id}`, payload);
      if (!res.ok) throw new Error('PATCH failed');
      await fetchThread();
    } catch (e) {
      setActionError('Не удалось отправить номер на модерацию');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    // Optional: Navigate back; no additional fields to save on this page
    navigate(`/thread-form/${id}${id !== 'new' ? '?mode=edit' : ''}`);
  };

  const handleDisconnectChannel = async () => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const payload = { telephony_virtual_phone: '' };
      const res = await http.patch(`/api/v2/threads/${id}`, payload);
      if (!res.ok) throw new Error('PATCH failed');
      await fetchThread();
      setShowDisconnectConfirm(false);
    } catch (e) {
      setActionError('Не удалось отключить канал');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <YellowFigures />
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
      />
      <main className={`
        pt-4 nav-transition relative z-10
        ${sidebarCollapsed ? 'lg:ml-sidebar-collapsed' : 'lg:ml-sidebar-width'}
      `}>
        <div className="p-4 w-full">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(`/thread-form/${id}${id !== 'new' ? '?mode=edit' : ''}`)}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 nav-transition text-sm"
                >
                  <Icon name="ArrowLeft" size={14} color="#6B7280" />
                  <span>Назад к потоку</span>
                </button>
                <div className="h-5 w-px bg-gray-300"></div>
                <h1 className="text-2xl font-bold text-black flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <Icon name="Phone" size={18} color="white" />
                  </div>
                  Настройка телефонии
                </h1>
                {channelData.threadName && (
                  <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {channelData.threadName}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  channelData.status === 'connected' ? 'bg-green-100 text-green-800'
                    : channelData.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                    : channelData.status === 'error' ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {channelData.status === 'connected' && 'Подключено'}
                  {channelData.status === 'pending' && 'На рассмотрении'}
                  {channelData.status === 'error' && 'Ошибка подключения'}
                  {channelData.status === 'not_connected' && 'Не подключено'}
                </div>
                <button
                  onClick={fetchThread}
                  className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 nav-transition text-xs"
                >
                  <Icon name="RefreshCw" size={12} />
                  <span>Обновить статус</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              {loadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{loadError}</div>
              )}
              {actionError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{actionError}</div>
              )}
              {channelData.status === 'not_connected' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-black mb-4">Подключение телефонии</h2>
                    <p className="text-gray-600 mb-6">Подключение номера телефона к системе контакт центра</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Номер телефона <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={channelData.config.phoneNumber || ''}
                      onChange={(e) => handlePhoneNumberChange('phoneNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base nav-transition"
                      placeholder="+7 (800) 123-45-67"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Укажите номер телефона в международном формате
                    </p>
                  </div>

                  <button
                    onClick={handleTelephonyConnect}
                    disabled={!isValidPhone(channelData.config.phoneNumber) || isSubmitting}
                    className={`
                      px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium nav-transition
                      ${(!isValidPhone(channelData.config.phoneNumber) || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center space-x-2"><Icon name="Loader2" size={16} className="animate-spin" /> Отправка…</span>
                    ) : 'Отправить на подключение'}
                  </button>
                </div>
              )}

              {channelData.status === 'pending' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-black mb-4">Заявка на рассмотрении</h2>
                    <p className="text-gray-600 mb-6">Операторы проверяют номер телефона</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                      <Icon name="Clock" size={20} color="#d97706" />
                      <span className="font-medium">Заявка отправлена на рассмотрение</span>
                    </div>
                    <p className="text-yellow-700 text-sm mb-2">
                      Номер: <strong>{channelData.config.phoneNumber}</strong>
                    </p>
                    <p className="text-yellow-700 text-sm">
                      Операторы рассмотрят заявку и подключат номер к телефонии. Вы получите уведомление о статусе.
                    </p>
                  </div>
                </div>
              )}

              {channelData.status === 'error' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-black mb-4">Ошибка подключения</h2>
                    <p className="text-gray-600 mb-6">Проверьте номер и повторите попытку</p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-800 mb-2">
                      <Icon name="AlertTriangle" size={20} color="#dc2626" />
                      <span className="font-medium">Подключение не удалось</span>
                    </div>
                    <p className="text-red-700 text-sm mb-2">
                      Текущий номер: <strong>{channelData.config.phoneNumber || 'не указан'}</strong>
                    </p>
                    <p className="text-red-700 text-sm">
                      Укажите новый номер и отправьте на подключение снова.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Новый номер телефона <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={channelData.config.newPhoneNumber || ''}
                      onChange={(e) => handlePhoneNumberChange('newPhoneNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base nav-transition"
                      placeholder="+7 (800) 123-45-67"
                    />
                  </div>

                  <button
                    onClick={handleChangePhoneNumber}
                    disabled={!isValidPhone(channelData.config.newPhoneNumber) || isSubmitting}
                    className={`
                      px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium nav-transition
                      ${(!isValidPhone(channelData.config.newPhoneNumber) || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center space-x-2"><Icon name="Loader2" size={16} className="animate-spin" /> Отправка…</span>
                    ) : 'Повторить подключение'}
                  </button>
                </div>
              )}

              {channelData.status === 'connected' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-black mb-4">Телефония подключена</h2>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-800 mb-2">
                      <Icon name="CheckCircle" size={20} color="#16a34a" />
                      <span className="font-medium">Телефония подключена</span>
                    </div>
                    <p className="text-green-700 text-sm mb-1">
                      Номер: <strong>{channelData.config.phoneNumber}</strong>
                    </p>
                    {channelData.config.connectionDate && (
                      <p className="text-green-700 text-sm">
                        Дата подключения: {channelData.config.connectionDate}
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <div className="space-y-4">
                      <div className="flex space-x-3">
                        <button
                          onClick={handleChangePhoneNumber}
                          disabled={!isValidPhone(channelData.config.newPhoneNumber) || isSubmitting}
                          className={`
                            px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium nav-transition
                            ${(!isValidPhone(channelData.config.newPhoneNumber) || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center space-x-2"><Icon name="Loader2" size={16} className="animate-spin" /> Отправка…</span>
                          ) : 'Отправить на модерацию'}
                        </button>
                        
                        {!showDisconnectConfirm ? (
                          <button
                            onClick={() => setShowDisconnectConfirm(true)}
                            className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium nav-transition"
                          >
                            Отключить канал
                          </button>
                        ) : (
                          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Icon name="AlertTriangle" size={16} color="#dc2626" />
                              <span className="text-sm font-medium text-red-800">
                                Отключить номер {channelData.config.phoneNumber}?
                              </span>
                            </div>
                            <div className="flex space-x-2 ml-auto">
                              <button
                                onClick={handleDisconnectChannel}
                                disabled={isSubmitting}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium nav-transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSubmitting ? (
                                  <span className="flex items-center space-x-2"><Icon name="Loader2" size={14} className="animate-spin" /> Да</span>
                                ) : 'Да'}
                              </button>
                              <button
                                onClick={() => setShowDisconnectConfirm(false)}
                                className="px-3 py-1 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm rounded font-medium nav-transition"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChannelTelephonySettings;
