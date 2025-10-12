import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import http from 'services/http';

const ChannelAvitoSettings = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [channelData, setChannelData] = useState({
    threadId: id,
    threadName: '',
    status: 'not_connected',
    config: {
      accountId: '',
      connectionDate: null
    }
  });

  useEffect(() => {
    if (!id || id === 'new') return;
    let cancelled = false;

    const fetchThread = async () => {
      try {
        const { ok, data } = await http.get(`/api/v2/threads/${id}`);
        if (cancelled) return;
        if (ok && data) {
          const connected = Boolean(data.avito_account_id);
          setChannelData(prev => ({
            ...prev,
            threadId: id,
            threadName: data.title || '',
            status: connected ? 'connected' : 'not_connected',
            config: {
              accountId: data.avito_account_id || '',
              connectionDate: data.avito_connect_date || null,
            },
          }));
        } else {
          setChannelData(prev => ({
            ...prev,
            threadId: id,
            threadName: '',
            status: 'not_connected',
            config: { accountId: '', connectionDate: null },
          }));
        }
      } catch (e) {
        if (!cancelled) {
          setChannelData(prev => ({
            ...prev,
            threadId: id,
            threadName: '',
            status: 'not_connected',
            config: { accountId: '', connectionDate: null },
          }));
        }
      }
    };

    // Initial fetch
    fetchThread();
    // Poll every 7 seconds
    const intervalId = setInterval(fetchThread, 7000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [id]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleAvitoOAuth = () => {
    if (!id) return;
    const url = `/api/v1/avito/auth-app/${id}`;
    window.location.href = url;
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saving Avito channel configuration:', channelData);
      navigate(`/thread-form/${id}${id !== 'new' ? '?mode=edit' : ''}`);
    } catch (error) {
      console.error('Error saving Avito channel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
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
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <img 
                      src="/assets/images/avito_logo.png" 
                      alt="Avito Logo" 
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  Настройка Авито
                </h1>
                {channelData.threadName && (
                  <div className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                    {channelData.threadName}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  channelData.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {channelData.status === 'connected' ? 'Подключено' : 'Не подключено'}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              {channelData.status !== 'connected' ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-black mb-4">Подключение Авито</h2>
                    <p className="text-gray-600 mb-6">Интеграция с аккаунтом Авито вебмастера для отслеживания лидов</p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2">OAuth авторизация</h4>
                    <p className="text-orange-700 text-sm mb-3">
                      Нажмите кнопку ниже для предоставления доступа нашего приложения к вашему аккаунту Авито вебмастера. 
                      Это безопасно и позволит системе получать данные о лидах с ваших объявлений.
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Что произойдет после подключения:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>Автоматическое отслеживание звонков и сообщений</li>
                      <li>Синхронизация лидов с вашим аккаунтом</li>
                      <li>Детальная аналитика по объявлениям</li>
                      <li>Уведомления о новых лидах</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleAvitoOAuth}
                    className="w-full sm:w-auto px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium nav-transition flex items-center justify-center space-x-2"
                  >
                    <Icon name="ExternalLink" size={16} color="white" />
                    <span>Подключить через OAuth</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-black mb-4">Авито успешно подключено</h2>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-800 mb-2">
                      <Icon name="CheckCircle" size={20} color="#16a34a" />
                      <span className="font-medium">Авито успешно подключено</span>
                    </div>
                    <p className="text-green-700 text-sm mb-1">
                      ID аккаунта: <strong>{channelData.config.accountId}</strong>
                    </p>
                    <p className="text-green-700 text-sm">
                      Дата подключения: {channelData.config.connectionDate}
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Управление подключением</h4>
                    <div className="space-y-4">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setChannelData(prev => ({ ...prev, status: 'not_connected', config: { accountId: '', connectionDate: null } }))}
                          className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium nav-transition"
                        >
                          Отключить канал
                        </button>
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

export default ChannelAvitoSettings;
