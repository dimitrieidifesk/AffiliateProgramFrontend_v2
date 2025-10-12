import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import http from 'services/http';

const ChannelApiSettings = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showReconnectConfirm, setShowReconnectConfirm] = useState(false);
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
    status: 'not_connected', // not_connected, waiting_request, configuring, connected
    config: {
      url: '',
      receivedRequest: null,
      fieldMapping: {
        city: '',        // Город (опционально)
        contact_name: '', // Имя клиента (опционально) 
        contact_phone: '', // Номер клиента (обязательно)
        click_id: ''     // click_id (опционально)
      },
      availableFields: [] // Плоский список всех полей из JSON
    }
  });

  const [pollingInterval, setPollingInterval] = useState(null);

  // Build public URL by wh_key
  const buildPublicUrl = (whKey) => whKey ? `https://leadmaker.top/api/v1/user/lead/${whKey}` : '';

  // Fetch thread to get title + wh_key, then check last request immediately
  const fetchThread = async () => {
    if (!id || id === 'new') return;
    setLoadError(null);
    try {
  const res = await http.get(`/api/v2/threads/${id}`, { navigate });
      if (res.ok && res.data) {
        const t = res.data;
        setChannelData(prev => ({
          ...prev,
          threadId: id,
          threadName: t.title || '',
          status: 'not_connected',
          config: {
            ...prev.config,
            url: buildPublicUrl(t.wh_key),
            // Prefill mapping from thread params if present
            fieldMapping: {
              city: t.wh_city_pathname || '',
              contact_name: t.wh_client_name_pathname || '',
              contact_phone: t.wh_client_phone_pathname || '',
              click_id: t.wh_click_id_pathname || ''
            }
          }
        }));
        await checkLastRequest();
      } else {
        setLoadError('Не удалось загрузить данные потока');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load thread', e);
      setLoadError('Ошибка загрузки данных');
    }
  };

  // Check backend for last test request for this thread
  const checkLastRequest = async () => {
    try {
  const res = await http.get(`/api/v1/user/get_last_request/${id}`, { navigate });
      if (res.ok && res.data) {
        const lastReq = res.data.last_request || {};
        const keys = Array.isArray(res.data.keys) ? res.data.keys : [];
        const hasData = lastReq && Object.keys(lastReq).length > 0 && keys.length > 0;
        if (hasData) {
          setChannelData(prev => {
            // Ensure any prefilled mapping values are present in the options list
            const prefilled = Object.values(prev.config.fieldMapping || {}).filter(Boolean);
            const merged = Array.from(new Set([...(keys || []), ...prefilled]));
            return {
              ...prev,
              status: 'configuring',
              config: {
                ...prev.config,
                receivedRequest: lastReq,
                availableFields: merged,
              }
            };
          });
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        } else {
          // Start waiting state and polling if not already
          if (channelData.status !== 'waiting_request') {
            setChannelData(prev => ({ ...prev, status: 'waiting_request' }));
          }
          if (!pollingInterval) {
            const interval = setInterval(() => {
              checkLastRequest();
            }, 5000);
            setPollingInterval(interval);
          }
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to check last request', e);
    }
  };

  useEffect(() => {
    fetchThread();
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Stop any polling once the channel is connected
  useEffect(() => {
    if (channelData.status === 'connected' && pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [channelData.status, pollingInterval]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Функция для преобразования JSON в плоский массив полей
  const flattenJson = (obj, prefix = '') => {
    let fields = [];
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          // Рекурсивно обрабатываем вложенные объекты
          fields = fields.concat(flattenJson(obj[key], newKey));
        } else {
          // Добавляем поле в список
          fields.push(newKey);
        }
      }
    }
    
    return fields;
  };

  // Polling now handled by checkLastRequest()

  // Начать ожидание POST запроса
  const handleStartWaiting = () => {
    // Force waiting and trigger immediate check + polling
    setChannelData(prev => ({ ...prev, status: 'waiting_request' }));
    if (pollingInterval) clearInterval(pollingInterval);
    const interval = setInterval(() => {
      checkLastRequest();
    }, 5000);
    setPollingInterval(interval);
    // Do an immediate check as well
    checkLastRequest();
  };

  // Обновление mapping полей
  const handleFieldMappingChange = (parameterName, fieldKey) => {
    setChannelData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        fieldMapping: {
          ...prev.config.fieldMapping,
          [parameterName]: fieldKey
        }
      }
    }));
  };

  // Проверка, можно ли подключить канал (обязательно только contact_phone)
  const canConnectChannel = () => {
    return channelData.config.fieldMapping.contact_phone.trim() !== '';
  };

  const handleApiConnect = async () => {
    if (!canConnectChannel()) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const payload = {
        wh_city_pathname: channelData.config.fieldMapping.city || null,
        wh_client_name_pathname: channelData.config.fieldMapping.contact_name || null,
        wh_client_phone_pathname: channelData.config.fieldMapping.contact_phone || null,
        wh_click_id_pathname: channelData.config.fieldMapping.click_id || null,
      };
  const res = await http.patch(`/api/v2/threads/${id}`, payload, { navigate });
      if (!res.ok) throw new Error('PATCH failed');
      setChannelData(prev => ({ ...prev, status: 'connected' }));
    } catch (e) {
      setActionError('Не удалось сохранить маппинг полей');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saving API channel configuration:', channelData);
      navigate(`/thread-form/${id}${id !== 'new' ? '?mode=edit' : ''}`);
    } catch (error) {
      console.error('Error saving API channel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnectChannel = () => {
    setChannelData(prev => ({ 
      ...prev, 
      status: 'not_connected',
      config: {
        ...prev.config,
        receivedRequest: null,
        fieldMapping: {
          city: '',
          contact_name: '',
          contact_phone: '',
          click_id: ''
        },
        availableFields: []
      }
    }));
    setShowDisconnectConfirm(false);
  };

  const handleReconnectChannel = () => {
    setChannelData(prev => ({ 
      ...prev, 
      status: 'not_connected',
      config: {
        ...prev.config,
        receivedRequest: null,
        fieldMapping: {
          city: '',
          contact_name: '',
          contact_phone: '',
          click_id: ''
        },
        availableFields: []
      }
    }));
    setShowReconnectConfirm(false);
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
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <Icon name="Code" size={18} color="white" />
                  </div>
                  Настройка API
                </h1>
                {channelData.threadName && (
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {channelData.threadName}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  channelData.status === 'connected' ? 'bg-green-100 text-green-800' 
                    : channelData.status === 'configuring' ? 'bg-blue-100 text-blue-800'
                    : channelData.status === 'waiting_request' ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {channelData.status === 'connected' && 'Подключено'}
                  {channelData.status === 'configuring' && 'Настройка полей'}
                  {channelData.status === 'waiting_request' && 'Ожидание запроса'}
                  {channelData.status === 'not_connected' && 'Не подключено'}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              {loadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{loadError}</div>
              )}
              {actionError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{actionError}</div>
              )}
              
              {/* Не подключено - показываем URL */}
              {channelData.status === 'not_connected' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-black mb-4">Настройка API канала</h2>
                    <p className="text-gray-600 mb-6">Для подключения отправьте POST запрос на указанный эндпоинт</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Ваш уникальный URL для создания лидов</h4>
                    <div className="bg-white border border-blue-300 rounded-lg p-3 mb-3">
                      <code className="text-sm text-blue-800 break-all">
                        {channelData.config.url}
                      </code>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Метод:</strong> POST
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Icon name="Info" size={16} color="#d97706" className="mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900 mb-1">Инструкция по подключению</h4>
                        <ol className="text-yellow-700 text-sm list-decimal list-inside space-y-1">
                          <li>Отправьте POST запрос с тестовыми данными лида на указанный URL</li>
                          <li>Нажмите кнопку "Ожидать запрос" ниже</li>
                          <li>Система автоматически получит ваш запрос и предложит настроить поля</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartWaiting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium nav-transition"
                  >
                    Ожидать POST запрос
                  </button>
                </div>
              )}

              {/* Ожидание запроса */}
              {channelData.status === 'waiting_request' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-black mb-4">Ожидание POST запроса</h2>
                    <p className="text-gray-600 mb-6">Отправьте POST запрос с тестовыми данными на эндпоинт</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Эндпоинт для POST запроса</h4>
                    <div className="bg-white border border-blue-300 rounded-lg p-3 mb-3">
                      <code className="text-sm text-blue-800 break-all">
                        {channelData.config.url}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="animate-spin">
                      <Icon name="Loader2" size={20} color="#d97706" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-900">Ожидаем POST запрос...</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (pollingInterval) clearInterval(pollingInterval);
                      setPollingInterval(null);
                      setChannelData(prev => ({ ...prev, status: 'not_connected', config: { ...prev.config, receivedRequest: null, availableFields: [] } }));
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg font-medium nav-transition"
                  >
                    Отменить ожидание
                  </button>
                </div>
              )}

              {/* Настройка полей - широкий макет */}
              {channelData.status === 'configuring' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Левая часть - настройка полей */}
                  <div className="xl:col-span-2 space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-black mb-4">Настройка полей лида</h2>
                      <p className="text-gray-600 mb-6">Получен POST запрос! Настройте соответствие полей для создания лидов</p>
                      {/* Эндпоинт для POST запроса */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-blue-900 mb-2">Эндпоинт для POST запроса</h4>
                        <div className="bg-white border border-blue-300 rounded-lg p-3">
                          <code className="text-sm text-blue-800 break-all">
                            {channelData.config.url}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Настройка параметров лида</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Номер клиента - обязательное поле */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Номер клиента <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={channelData.config.fieldMapping.contact_phone}
                            onChange={(e) => handleFieldMappingChange('contact_phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                          >
                            <option value="">Выберите поле</option>
                            {channelData.config.availableFields.map(field => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>
                        </div>

                        {/* Имя клиента */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Имя клиента (опционально)
                          </label>
                          <select
                            value={channelData.config.fieldMapping.contact_name}
                            onChange={(e) => handleFieldMappingChange('contact_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                          >
                            <option value="">Не использовать</option>
                            {channelData.config.availableFields.map(field => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>
                        </div>

                        {/* Город */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Город (опционально)
                          </label>
                          <select
                            value={channelData.config.fieldMapping.city}
                            onChange={(e) => handleFieldMappingChange('city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                          >
                            <option value="">Не использовать</option>
                            {channelData.config.availableFields.map(field => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>
                        </div>

                        {/* Click ID */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Click ID (опционально)
                          </label>
                          <select
                            value={channelData.config.fieldMapping.click_id}
                            onChange={(e) => handleFieldMappingChange('click_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                          >
                            <option value="">Не использовать</option>
                            {channelData.config.availableFields.map(field => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          onClick={handleApiConnect}
                          disabled={!canConnectChannel()}
                          className={`
                            px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium nav-transition
                            ${!canConnectChannel() ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          Сохранить
                        </button>
                        {!canConnectChannel() && (
                          <p className="text-sm text-red-600 mt-2">
                            Поле "Номер клиента" обязательно для заполнения
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Правая часть - JSON схема и доступные поля */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sticky top-4">
                      <h4 className="font-medium text-gray-900 mb-3">Полученные данные (JSON):</h4>
                      <pre className="text-xs text-gray-800 bg-white border rounded p-3 overflow-auto max-h-64">
                        {JSON.stringify(channelData.config.receivedRequest, null, 2)}
                      </pre>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sticky top-80">
                      <h4 className="font-medium text-blue-900 mb-3">Доступные поля:</h4>
                      <div className="space-y-1 max-h-64 overflow-auto">
                        {channelData.config.availableFields.map(field => (
                          <div key={field} className="text-xs font-mono text-blue-800 bg-white px-2 py-1 rounded border">
                            {field}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Канал подключен */}
              {channelData.status === 'connected' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Левая часть - основная информация */}
                  <div className="xl:col-span-2 space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-black mb-4">API канал подключен</h2>
                      <p className="text-gray-600 mb-6">Канал готов к приему лидов через POST запросы</p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-green-800 mb-3">
                        <Icon name="CheckCircle" size={20} color="#16a34a" />
                        <span className="font-medium">API канал успешно подключен</span>
                      </div>
                      <div className="bg-white border border-green-300 rounded-lg p-3 mb-3">
                        <code className="text-sm text-green-800 break-all">
                          {channelData.config.url}
                        </code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Настроенные поля:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Номер клиента:</span>
                          <code className="text-sm font-mono text-gray-800">{channelData.config.fieldMapping.contact_phone || 'Не задано'}</code>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Имя клиента:</span>
                          <code className="text-sm font-mono text-gray-800">{channelData.config.fieldMapping.contact_name || 'Не задано'}</code>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Город:</span>
                          <code className="text-sm font-mono text-gray-800">{channelData.config.fieldMapping.city || 'Не задано'}</code>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Click ID:</span>
                          <code className="text-sm font-mono text-gray-800">{channelData.config.fieldMapping.click_id || 'Не задано'}</code>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-3">
                          
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
                                  Отключить API канал?
                                </span>
                              </div>
                              <div className="flex space-x-2 ml-auto">
                                <button
                                  onClick={handleDisconnectChannel}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium nav-transition"
                                >
                                  Да
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

                  {/* Правая часть - JSON схема */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sticky top-4">
                      <h4 className="font-medium text-gray-900 mb-3">JSON схема запроса:</h4>
                      <pre className="text-xs text-gray-800 bg-white border rounded p-3 overflow-auto max-h-96">
                        {JSON.stringify(channelData.config.receivedRequest, null, 2)}
                      </pre>
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

export default ChannelApiSettings;
