import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import http from 'services/http';

const ThreadPostbacks = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

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

  // Status meta by title for description/icon/color
  const getStatusMeta = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('в работе')) return { color: 'blue', description: 'Лид принят в обработку', icon: 'Loader2' };
    if (t.includes('назначено')) return { color: 'purple', description: 'Лид назначен оператору', icon: 'CalendarCheck' };
    if (t.includes('подтвержден')) return { color: 'green', description: 'Лид подтвержден клиентом', icon: 'CheckCircle' };
    if (t.includes('отказ')) return { color: 'red', description: 'Клиент отказался от услуги', icon: 'XCircle' };
    if (t.includes('некачественный')) return { color: 'gray', description: 'Лид не соответствует требованиям', icon: 'AlertTriangle' };
    return { color: 'gray', description: '', icon: 'Tag' };
  };

  // Available parameters for postback URLs
  const availableParams = [
    { key: 'click_id', description: 'Уникальный ID клика' },
    { key: 'city', description: 'Город клиента' },
    { key: 'contact_name', description: 'Имя контакта' },
    { key: 'contact_phone', description: 'Телефон контакта' },
    { key: 'lead_id', description: 'ID лида в системе' },
    { key: 'status_title', description: 'Название статуса' },
    { key: 'payout', description: 'Сумма выплаты' }
  ];

  const [postbackData, setPostbackData] = useState({ threadId: id, threadName: '', postbacks: {} });
  const [statusList, setStatusList] = useState([]); // [{status_id, status_title, url, connected}]
  const [titleToId, setTitleToId] = useState({});

  // Load statuses and thread name
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        // Load statuses for this thread
        const res = await http.get(`/api/v2/offers/statuses/${id}`, { navigate });
        if (!mounted) return;
        if (res.ok && Array.isArray(res.data)) {
          const list = res.data;
          const t2i = {};
          const initial = {};
          list.forEach(st => {
            t2i[st.status_title] = st.status_id;
            initial[st.status_title] = {
              url: st.url || '',
              savedUrl: st.url || '',
              testResult: null,
              saved: Boolean(st.url),
            };
          });
          setStatusList(list);
          setTitleToId(t2i);
          setPostbackData(prev => ({ ...prev, postbacks: initial }));
        } else {
          setStatusList([]);
          setPostbackData(prev => ({ ...prev, postbacks: {} }));
        }
        // Optionally load thread name for header badge
        const thr = await http.get(`/api/v2/threads/${id}`, { navigate });
        if (thr.ok && thr.data?.title) {
          setPostbackData(prev => ({ ...prev, threadName: thr.data.title }));
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load postback statuses', e);
        setLoadError('Не удалось загрузить статусы');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (id && id !== 'new') init();
    return () => { mounted = false; };
  }, [id, navigate]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handlePostbackChange = (statusName, field, value) => {
    setPostbackData(prev => ({
      ...prev,
      postbacks: {
        ...prev.postbacks,
        [statusName]: {
          ...prev.postbacks[statusName],
          [field]: value,
          ...(field === 'url' && { testResult: null }) // Clear test result when URL changes
        }
      }
    }));
  };

  // Build payload combining previously saved URLs and newly tested-ok URLs
  const buildPayloadUrls = (state) => {
    const payloadUrls = {};
    // Start with savedUrl values (persisted on backend)
    Object.entries(state.postbacks || {}).forEach(([title, pb]) => {
      const sid = titleToId[title];
      const saved = (pb?.savedUrl || '').trim();
      if (sid && saved) payloadUrls[String(sid)] = saved;
    });
    // Override with newly tested-ok current URLs
    Object.entries(state.postbacks || {}).forEach(([title, pb]) => {
      const sid = titleToId[title];
      const u = (pb?.url || '').trim();
      if (!sid || !u) return;
      if (pb?.testResult && pb.testResult.success) payloadUrls[String(sid)] = u;
    });
    return payloadUrls;
  };

  const handleTestPostback = async (statusName) => {
    const postback = postbackData.postbacks[statusName];
    const url = postback?.url?.trim();
    if (!url) return;

    setPostbackData(prev => ({
      ...prev,
      postbacks: {
        ...prev.postbacks,
        [statusName]: { ...prev.postbacks[statusName], testing: true, testResult: null }
      }
    }));

    try {
      const res = await http.post(`/api/v2/threads/${id}/test_wh`, { test_url: url }, { navigate });
        if (res.ok && res.data) {
        if (res.data.success) {
          // Build next state snapshot with success result
          setPostbackData(prev => {
            const next = {
              ...prev,
              postbacks: {
                ...prev.postbacks,
                [statusName]: {
                  ...prev.postbacks[statusName],
                  testing: false,
                  testResult: { success: true, statusCode: res.data.status_code, elapsedMs: res.data.elapsed_ms },
                },
              },
            };
            // Auto-save: send previously saved + newly tested URLs
            (async () => {
              const payloadUrls = buildPayloadUrls(next);
              try {
                const saveRes = await http.patch(`/api/v2/threads/${id}`, { statuses_postback_urls: payloadUrls }, { navigate });
                if (saveRes.ok) {
                  const savedSidSet = new Set(Object.keys(payloadUrls));
                  setPostbackData(prev2 => {
                    const updated = { ...prev2, postbacks: { ...prev2.postbacks } };
                    Object.entries(updated.postbacks).forEach(([t, pbVal]) => {
                      const sid = titleToId[t];
                      const key = sid && String(sid);
                      if (key && savedSidSet.has(key)) {
                        updated.postbacks[t] = { ...pbVal, saved: true, savedUrl: payloadUrls[key] };
                      } else {
                        updated.postbacks[t] = { ...pbVal, saved: false, savedUrl: '' };
                      }
                    });
                    return updated;
                  });
                }
              } catch {}
            })();
            return next;
          });
        } else {
          setPostbackData(prev => ({
            ...prev,
            postbacks: {
              ...prev.postbacks,
              [statusName]: { ...prev.postbacks[statusName], testing: false, testResult: { success: false, error: res.data.error || res.data.detail || 'Тест не пройден', elapsedMs: res.data?.elapsed_ms } }
            }
          }));
        }
      } else {
        setPostbackData(prev => ({
          ...prev,
          postbacks: {
            ...prev.postbacks,
            [statusName]: { ...prev.postbacks[statusName], testing: false, testResult: { success: false, error: 'Тест не пройден' } }
          }
        }));
      }
    } catch (e) {
      setPostbackData(prev => ({
        ...prev,
        postbacks: {
            ...prev.postbacks,
            [statusName]: { ...prev.postbacks[statusName], testing: false, testResult: { success: false, error: 'Ошибка сети' } }
        }
      }));
    }
  };

  const clearUrlAndSave = async (statusTitle) => {
    setPostbackData(prev => {
      const next = {
        ...prev,
        postbacks: {
          ...prev.postbacks,
          [statusTitle]: { ...(prev.postbacks[statusTitle] || {}), url: '', testResult: null, saved: false, savedUrl: '' },
        },
      };
      // After clearing, persist remaining successfully tested URLs
      (async () => {
        const payloadUrls = buildPayloadUrls(next);
        try {
          const saveRes = await http.patch(`/api/v2/threads/${id}`, { statuses_postback_urls: payloadUrls }, { navigate });
          if (saveRes.ok) {
            const savedSidSet = new Set(Object.keys(payloadUrls));
            setPostbackData(prev2 => {
              const updated = { ...prev2, postbacks: { ...prev2.postbacks } };
              Object.entries(updated.postbacks).forEach(([t, pbVal]) => {
                const sid = titleToId[t];
                const key = sid && String(sid);
                if (key && savedSidSet.has(key)) {
                  updated.postbacks[t] = { ...pbVal, saved: true, savedUrl: payloadUrls[key] };
                } else {
                  updated.postbacks[t] = { ...pbVal, saved: false, savedUrl: '' };
                }
              });
              return updated;
            });
          }
        } catch {}
      })();
      return next;
    });
  };

  const handleSave = async () => {
    if (!id || id === 'new') return;
    setIsSubmitting(true);
    try {
      // Combine previously saved and newly tested-ok URLs
      const payloadUrls = buildPayloadUrls(postbackData);

      const res = await http.patch(`/api/v2/threads/${id}`, { statuses_postback_urls: payloadUrls }, { navigate });
      if (res.ok) {
        // Update saved flags and savedUrl to reflect backend state
        const savedSidSet = new Set(Object.keys(payloadUrls));
        setPostbackData(prev2 => {
          const updated = { ...prev2, postbacks: { ...prev2.postbacks } };
          Object.entries(updated.postbacks).forEach(([t, pbVal]) => {
            const sid = titleToId[t];
            const key = sid && String(sid);
            if (key && savedSidSet.has(key)) {
              updated.postbacks[t] = { ...pbVal, saved: true, savedUrl: payloadUrls[key] };
            } else {
              updated.postbacks[t] = { ...pbVal, saved: false, savedUrl: '' };
            }
          });
          return updated;
        });
        navigate(`/thread-form/${id}?mode=edit`);
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to save postbacks', res.data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving postbacks:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      gray: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const enabledCount = Object.values(postbackData.postbacks).filter(pb => pb?.saved).length;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <YellowFigures />
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
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
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <Icon name="Webhook" size={18} color="white" />
                  </div>
                  Настройка постбеков
                </h1>
                {postbackData.threadName && (
                  <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    {postbackData.threadName}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  Настроено: <span className="font-semibold">{enabledCount}/5</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4">
              {loadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{loadError}</div>
              )}
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                statusList.map((status) => {
                  const title = status.status_title;
                  const meta = getStatusMeta(title);
                  const postback = postbackData.postbacks[title] || {};
                  return (
                    <div key={status.status_id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${getStatusColor(meta.color)} rounded-lg flex items-center justify-center shadow-lg`}>
                            <Icon name={meta.icon} size={16} color="white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-black">{title}</h3>
                            <p className="text-sm text-gray-600">{meta.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {postback.testResult && (
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${postback.testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              <Icon name={postback.testResult.success ? 'CheckCircle' : 'XCircle'} size={14} />
                              <span className="text-xs font-medium">
                                {postback.testResult.success ? 'Тест пройден' : postback.testResult.error}
                              </span>
                              {typeof postback.testResult.elapsedMs === 'number' && (
                                <span className="text-[10px] opacity-80">{postback.testResult.elapsedMs} мс</span>
                              )}
                            </div>
                          )}
                          {postback.saved ? (
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Включено</div>
                          ) : (
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Отключено</div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-3">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            URL для постбека
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={postback.url || ''}
                              onChange={(e) => handlePostbackChange(title, 'url', e.target.value)}
                              className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-sm nav-transition font-mono placeholder:text-gray-400"
                              placeholder={`http://example.ru/postback?status=${status.status_id}&lead_id={lead_id}&click_id={click_id}`}
                            />
                            {postback.url?.trim() && (
                              <button
                                type="button"
                                onClick={() => clearUrlAndSave(title)}
                                aria-label="Очистить URL"
                                className="absolute inset-y-0 right-2 my-auto h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-md"
                              >
                                <Icon name="X" size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="h-full flex items-end">
                          <button
                            onClick={() => handleTestPostback(title)}
                            disabled={!postback.url?.trim() || postback.testing}
                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg nav-transition font-semibold shadow-sm text-sm"
                          >
                            {postback.testing ? (
                              <div className="flex items-center justify-center space-x-2">
                                <Icon name="Loader2" size={14} className="animate-spin" />
                                <span>Тест...</span>
                              </div>
                            ) : (
                              'Тестировать'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar with parameters */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-4">
                <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                  <Icon name="Info" size={16} className="mr-2" />
                  Доступные параметры
                </h3>
                <div className="space-y-3">
                  {availableParams.map((param) => (
                    <div key={param.key} className="border border-gray-200 rounded-lg p-3">
                      <code className="text-sm font-mono text-purple-600 font-semibold">
                        {`{${param.key}}`}
                      </code>
                      <p className="text-xs text-gray-600 mt-1">{param.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">Пример URL:</h4>
                  <code className="text-xs text-yellow-700 break-all">
                    http://example.ru/postback?click_id={'{click_id}'}&amp;lead_id={'{lead_id}'}&amp;status={'{status_title}'}
                  </code>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ThreadPostbacks;
