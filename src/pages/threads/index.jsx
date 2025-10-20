import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import http from 'services/http';
import { getCurrentUserId } from 'utils/auth';


const ThreadList = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [restoringId, setRestoringId] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [stats, setStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);

  // Mock user data
  const mockUser = {
    name: "Алексей Петров",
    email: "alex.petrov@leadmaker.pro", 
    role: "Старший вебмастер",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const loadThreadStats = async () => {
    setLoadingStats(true);
    try {
      const uid = getCurrentUserId() || '00000';
      
      // Дата год назад
      const start = new Date();
      start.setFullYear(start.getFullYear() - 1);
      const startDate = start.toISOString().split('.')[0]; // убираем миллисекунды
      
      // Завтрашняя дата
      const finish = new Date();
      finish.setDate(finish.getDate() + 1);
      const finishDate = finish.toISOString().split('.')[0];
      
      const params = new URLSearchParams();
      params.set('start', startDate);
      params.set('finish', finishDate);
      params.set('user_id', uid);
      
      const res = await http.get(`/api/v2/leads/stats/by-threads?${params.toString()}`, { navigate });
      
      if (res.ok && Array.isArray(res.data)) {
        // Конвертируем массив статистики в объект для быстрого поиска по thread_id
        const statsMap = {};
        res.data.forEach(stat => {
          statsMap[stat.thread_id] = stat;
        });
        setStats(statsMap);
      }
    } catch (e) {
      console.warn('Failed to load thread stats:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadThreads = async () => {
      setLoading(true);
      try {
        const uid = getCurrentUserId() || '00000';
  const params = new URLSearchParams();
        params.set('user_id', uid);
        if (showArchived) {
          params.set('only_deleted', 'true');
        } else {
          params.set('include_deleted', 'false');
        }
  const res = await http.get('/api/v2/threads/?' + params.toString(), { navigate });
        if (res.ok) {
          const items = Array.isArray(res.data?.items) ? res.data.items : [];
          const mapped = items.map((it) => ({
            id: it.id,
            name: it.title,
            description: it.comment || '',
            // Статус зависит от флага is_deleted с бэка
            status: it?.is_deleted ? 'disabled' : 'active',
            isDeleted: Boolean(it?.is_deleted),
            source: normalizeTrafficSource(it.traffic_source),
            telephonyPhone: it.telephony_virtual_phone || null,
            created: null,
          }));
          if (mounted) setThreads(mapped);
        } else {
          if (mounted) setThreads([]);
          // Можно добавить уведомление об ошибке
          // console.warn('Failed to load threads', res.status, res.data);
        }
      } catch (e) {
        if (mounted) setThreads([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadThreads();
    return () => { mounted = false; };
  }, [navigate, showArchived]);

  // Загружаем статистику только для активных потоков
  useEffect(() => {
    if (!showArchived && threads.length > 0) {
      loadThreadStats();
    }
  }, [threads, showArchived]);

  const handleCreateThread = () => {
    navigate('/thread-wizard');
  };

  const handleEditThread = (id) => {
    navigate(`/thread-form/${id}`);
  };

  const handleEditTools = (id) => {
    navigate(`/thread-tools/${id}`);
  };

  const handleViewDetails = (threadOrId) => {
    const t = typeof threadOrId === 'object' ? threadOrId : threads.find(x => String(x.id) === String(threadOrId));
    if (t?.isDeleted) return; // запрещаем переход для архивных потоков
    navigate(`/thread-form/${t?.id}?mode=view`);
  };

  const askDelete = (e, id) => {
    e?.stopPropagation?.();
    setDeleteError('');
    setDeletingId(id);
  };

  const cancelDelete = (e) => {
    e?.stopPropagation?.();
    setDeletingId(null);
    setDeleteError('');
  };

  const askRestore = (e, id) => {
    e?.stopPropagation?.();
    setRestoreError('');
    setRestoringId(id);
  };

  const cancelRestore = (e) => {
    e?.stopPropagation?.();
    setRestoringId(null);
    setRestoreError('');
  };

  const confirmDelete = async (e, id) => {
    e?.stopPropagation?.();
    if (!id) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await http.delete(`/api/v2/threads/${id}`, { navigate });
      if (res.ok) {
        setThreads(prev => prev.filter(t => String(t.id) !== String(id)));
        setDeletingId(null);
      } else {
        const msg = (res.data && (res.data.message || res.data.detail || res.data.error)) || 'Не удалось удалить поток';
        setDeleteError(msg);
      }
    } catch (_) {
      setDeleteError('Ошибка сети при удалении');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmRestore = async (e, id) => {
    e?.stopPropagation?.();
    if (!id) return;
    setIsRestoring(true);
    setRestoreError('');
    try {
      const res = await http.patch(`/api/v2/threads/${id}`, { is_deleted: false }, { navigate });
      if (res.ok) {
        if (showArchived) {
          // Remove from archive list on success
          setThreads(prev => prev.filter(t => String(t.id) !== String(id)));
        } else {
          // Update in place if ever visible in active list
          setThreads(prev => prev.map(t => String(t.id) === String(id) ? { ...t, isDeleted: false, status: 'active' } : t));
        }
        setRestoringId(null);
      } else {
        const msg = (res.data && (res.data.message || res.data.detail || res.data.error)) || 'Не удалось восстановить поток';
        setRestoreError(msg);
      }
    } catch (_) {
      setRestoreError('Ошибка сети при восстановлении');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })?.format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Активен', class: 'bg-green-100 text-green-800', dotClass: 'bg-green-500' },
      disabled: { label: 'Отключен', class: 'bg-gray-100 text-gray-800', dotClass: 'bg-gray-400' },
      paused: { label: 'Приостановлен', class: 'bg-yellow-100 text-yellow-800', dotClass: 'bg-yellow-500' },
      stopped: { label: 'Остановлен', class: 'bg-red-100 text-red-800', dotClass: 'bg-red-500' }
    };

    const config = statusConfig?.[status] || statusConfig?.disabled;
    return (
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${config?.dotClass} mr-2 ml-5`}></div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.class}`}>
          {config?.label}
        </span>
      </div>
    );
  };

  const getSourceIcon = (source) => {
    // Normalize first to handle backend label variations
    const label = normalizeTrafficSource(source);
    const sourceConfig = {
      'Яндекс Директ': { icon: 'Search', color: '#FF0000', bgColor: 'bg-red-50', name: 'ЯДирект' },
      'Google Ads': { icon: 'Chrome', color: '#4285F4', bgColor: 'bg-blue-50', name: 'Google' },
      'Facebook Ads': { icon: 'Facebook', color: '#1877F2', bgColor: 'bg-blue-50', name: 'Facebook' },
      'Карты 2GIS': { icon: 'Map', color: '#8B5CF6', bgColor: 'bg-purple-50', name: '2GIS' },
      'Авито': { icon: 'AvitoLogo', color: '#00A046', bgColor: 'bg-white', name: 'Авито' },
      'Маркетплейс услуг': { icon: 'Store', color: '#DB2777', bgColor: 'bg-pink-50', name: 'Маркетплейс' },
      'SEO': { icon: 'TrendingUp', color: '#8B5CF6', bgColor: 'bg-purple-50', name: 'SEO' },
      'VK Реклама': { icon: 'Users', color: '#0077FF', bgColor: 'bg-blue-50', name: 'VK' }
    };
    // Exact match first
    if (sourceConfig[label]) return sourceConfig[label];
    // Heuristic fallbacks
    const s = String(source || '').toLowerCase();
    if (s.includes('2gis') || s.includes('2 gis') || s.includes('карты') || s.includes('2гис') || s.includes('2 гис')) {
      return sourceConfig['Карты 2GIS'];
    }
    if (s.includes('профи') || s.includes('яндекс услуги') || s.includes('маркетплейс') || s.includes('услуги')) {
      return sourceConfig['Маркетплейс услуг'];
    }
    return { icon: 'Globe', color: '#6B7280', bgColor: 'bg-gray-50', name: label };
  };

  const normalizeTrafficSource = (raw) => {
    if (!raw) return 'Другое';
    const s = String(raw).trim().toLowerCase();
    if (s === 'яндекс директ' || s === 'яндекс директ ' || s === 'яндекс a0директ' || s === 'яндекс директ.'.replace('.', '')) return 'Яндекс Директ';
    if (s === 'яндекс  директ' || s === 'яндекс a0директ' || s === 'яндекс директ' || s === 'яндекс директ'.toLowerCase()) return 'Яндекс Директ';
    if (s.includes('яндекс') && s.includes('директ')) return 'Яндекс Директ';
    if (s.includes('google')) return 'Google Ads';
    if (s.includes('facebook')) return 'Facebook Ads';
    if (s.includes('авито')) return 'Авито';
    if (s.includes('2gis') || s.includes('2 gis') || s === 'карты' || s.includes('карты')) return 'Карты 2GIS';
    if (s.includes('профи') || s.includes('яндекс услуги') || s.includes('услуги') || s.includes('маркетплейс')) return 'Маркетплейс услуг';
    if (s.includes('seo')) return 'SEO';
    if (s.includes('vk') || s.includes('вк')) return 'VK Реклама';
    return raw;
  };

  // Yellow decorative figures component for top of page
  const YellowFigures = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-16 right-8 w-10 h-10 bg-yellow-200 rounded-full opacity-15 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
      <div className="absolute top-32 right-24 w-8 h-8 bg-yellow-300 transform rotate-45 opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-20 right-40 w-12 h-6 bg-yellow-400 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
      <div className="absolute top-48 right-12 w-4 h-10 bg-yellow-300 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute top-60 right-32 w-6 h-6 bg-yellow-400 opacity-20 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '5s' }}></div>
      <div className="absolute top-24 right-60 w-5 h-12 bg-yellow-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2.5s' }}></div>
      <div className="absolute top-40 right-80 w-7 h-7 bg-yellow-300 transform rotate-12 opacity-15 animate-bounce" style={{ animationDelay: '3s', animationDuration: '6s' }}></div>

      {/* Left side ambient figures (new) */}
      <div className="absolute top-24 left-6 w-10 h-10 bg-yellow-200 rounded-full opacity-15 animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '3.5s' }}></div>
      <div className="absolute top-44 left-20 w-8 h-8 bg-yellow-300 transform rotate-12 opacity-20 animate-pulse" style={{ animationDelay: '1.4s' }}></div>
      <div className="absolute top-16 left-40 w-14 h-6 bg-yellow-400 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '2.2s', animationDuration: '4.5s' }}></div>
      <div className="absolute top-64 left-10 w-4 h-12 bg-yellow-300 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '0.9s' }}></div>
      <div className="absolute top-32 left-56 w-5 h-10 bg-yellow-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2.9s' }}></div>
    </div>
  );

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
        <div className="p-6 w-full">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black mb-1 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <Icon name="GitBranch" size={18} color="white" />
                  </div>
                  Потоки привлечения
                </h1>
                <p className="text-gray-600">
                  Управление вашими потоками лидов
                </p>
              </div>
              <button
                onClick={handleCreateThread}
                className="mt-3 lg:mt-0 flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-3 rounded-lg font-medium transform hover:scale-105 active:scale-95 nav-transition shadow-lg"
              >
                <Icon name="Plus" size={18} color="black" />
                <span>Новый поток</span>
                <Icon name="ArrowRight" size={14} color="black" />
              </button>
            </div>
          </div>

          {/* Search + View Toggle */}
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-md">
              <Icon name="Search" size={16} color="#6B7280" className="absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск потоков..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-yellow-500 focus:outline-none w-full bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-sm ${!showArchived ? 'bg-yellow-100 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => setShowArchived(false)}
                >Активные</button>
                <button
                  className={`px-3 py-1.5 text-sm ${showArchived ? 'bg-yellow-100 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  onClick={() => setShowArchived(true)}
                >Архив</button>
              </div>
            </div>
          </div>

          {/* Empty state or Threads List */}
          {!loading && (!threads || threads.length === 0) ? (
            <div className="flex items-center justify-center py-24">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 max-w-lg text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center border border-yellow-200">
                  <Icon name="GitBranch" size={22} color="#F59E0B" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{showArchived ? 'В архиве пусто' : 'Пока нет потоков'}</h2>
                <p className="text-gray-600 mb-6">
                  {showArchived ? 'Здесь появятся потоки, перемещённые в архив.' : 'У вас пока еще нет потоков привлечения лидов. Создайте первый поток, чтобы начать работу.'}
                </p>
                {!showArchived && (
                  <button
                    onClick={handleCreateThread}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-5 py-2.5 rounded-lg font-medium transform hover:scale-105 active:scale-95 nav-transition shadow-lg"
                  >
                    <Icon name="Plus" size={18} color="black" />
                    <span>Создать первый поток</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {threads?.map((thread) => {
                const sourceConfig = getSourceIcon(thread?.source);
                const isArchived = Boolean(thread?.isDeleted);
                return (
                  <div
                    key={thread?.id}
                    className={`bg-white rounded-lg border border-gray-200 shadow-sm nav-transition p-4 ${isArchived ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}`}
                    onClick={isArchived ? undefined : () => handleViewDetails(thread)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left Section - Icon, Name and Description */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-12 h-12 ${sourceConfig?.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon name={sourceConfig?.icon} size={20} color={sourceConfig?.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-base font-semibold text-black">
                              {thread?.name}
                            </h3>
                            {thread?.telephonyPhone && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <Icon name="Phone" size={11} color="#F59E0B" />
                                <span className="font-medium text-yellow-800">
                                  {thread.telephonyPhone}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {thread?.description}
                          </p>
                        </div>
                      </div>

                      {/* Center Section - Key Metrics */}
                      <div className="flex items-center space-x-10 text-sm">
                        <div className="text-center min-w-[64px]">
                          {loading || loadingStats ? (
                            <div className="w-12 h-4 bg-gray-200 rounded animate-pulse mx-auto" />
                          ) : (
                            <div className="font-semibold text-black text-base">
                              {stats[thread?.id]?.total || 0}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">лидов</div>
                        </div>
                        {/* Некачественные лиды рядом с лидами */}
                        <div className="text-center min-w-[50px]">
                          {loading || loadingStats ? (
                            <div className="w-10 h-4 bg-gray-200 rounded animate-pulse mx-auto" />
                          ) : (
                            <div className="font-semibold text-gray-600 text-base">
                              {stats[thread?.id]?.bad_count || 0}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">некач.</div>
                        </div>
                        <div className="text-center min-w-[64px]">
                          {loading || loadingStats ? (
                            <div className="w-10 h-4 bg-gray-200 rounded animate-pulse mx-auto" />
                          ) : (
                            <div className="font-semibold text-green-600 text-base">
                              {stats[thread?.id]?.conversion_percent 
                                ? `${stats[thread?.id].conversion_percent.toFixed(1)}%` 
                                : '—'}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">конверсия</div>
                        </div>
                        <div className="text-center min-w-[80px]">
                          {loading || loadingStats ? (
                            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mx-auto" />
                          ) : (
                            <div className="font-semibold text-purple-600 text-base">
                              {stats[thread?.id]?.commission_confirmed_sum 
                                ? formatCurrency(stats[thread?.id].commission_confirmed_sum)
                                : '—'}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">доход</div>
                        </div>
                        {/* Сумма в холде */}
                        <div className="text-center min-w-[70px]">
                          {loading || loadingStats ? (
                            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mx-auto" />
                          ) : (
                            <div className="font-semibold text-orange-600 text-base">
                              {stats[thread?.id]?.commission_hold_sum 
                                ? formatCurrency(stats[thread?.id].commission_hold_sum)
                                : '—'}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">в холде</div>
                        </div>
                      </div>

                      {/* Right Section - Status and Actions */}
                      <div className="flex items-center space-x-8">
                        <div onClick={(e) => e?.stopPropagation()}>
                          {getStatusBadge(thread?.status || 'active')}
                        </div>
                        <div className="flex items-center space-x-2" onClick={(e) => e?.stopPropagation()}>
                          {deletingId === thread?.id ? (
                            <>
                              {deleteError ? (
                                <span className="text-xs text-red-600 mr-1 max-w-[220px] truncate" title={deleteError}>{deleteError}</span>
                              ) : null}
                              <button
                                onClick={(e) => cancelDelete(e)}
                                className="px-2 py-1 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 nav-transition"
                              >Отмена</button>
                              <button
                                onClick={(e) => confirmDelete(e, thread?.id)}
                                disabled={isDeleting}
                                className={`px-2 py-1 rounded-md text-xs font-medium nav-transition ${isDeleting ? 'opacity-60 cursor-wait' : ''} bg-red-600 hover:bg-red-700 text-white`}
                                title="В архив"
                              >
                                {isDeleting ? (
                                  <span className="inline-flex items-center space-x-1"><Icon name="Loader2" size={12} className="animate-spin" /><span>Перемещение…</span></span>
                                ) : 'В архив'}
                              </button>
                            </>
                          ) : restoringId === thread?.id ? (
                            <>
                              {restoreError ? (
                                <span className="text-xs text-red-600 mr-1 max-w-[220px] truncate" title={restoreError}>{restoreError}</span>
                              ) : null}
                              <button
                                onClick={(e) => cancelRestore(e)}
                                className="px-2 py-1 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50 nav-transition"
                              >Отмена</button>
                              <button
                                onClick={(e) => confirmRestore(e, thread?.id)}
                                disabled={isRestoring}
                                className={`px-2 py-1 rounded-md text-xs font-medium nav-transition ${isRestoring ? 'opacity-60 cursor-wait' : ''} bg-green-600 hover:bg-green-700 text-white`}
                                title="Восстановить"
                              >
                                {isRestoring ? (
                                  <span className="inline-flex items-center space-x-1"><Icon name="Loader2" size={12} className="animate-spin" /><span>Восстановление…</span></span>
                                ) : 'Восстановить'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={isArchived ? undefined : () => handleViewDetails(thread)}
                                className={`p-2 rounded-lg nav-transition ${isArchived ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'}`}
                                title="Настроить инструменты"
                                aria-disabled={isArchived}
                              >
                                <Icon name="Settings" size={16} color="#6B7280" />
                              </button>
                              <button
                                onClick={isArchived ? undefined : () => handleViewDetails(thread)}
                                className={`p-2 rounded-lg nav-transition ${isArchived ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'}`}
                                title="Подробнее"
                                aria-disabled={isArchived}
                              >
                                <Icon name="ChevronRight" size={16} color="#6B7280" />
                              </button>
                              {!showArchived && (
                                <button
                                  onClick={(e) => askDelete(e, thread?.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg nav-transition"
                                  title="В архив"
                                >
                                  <Icon name="Archive" size={16} color="#dc2626" />
                                </button>
                              )}
                              {showArchived && isArchived && (
                                <button
                                  onClick={(e) => askRestore(e, thread?.id)}
                                  className="p-2 hover:bg-green-50 rounded-lg nav-transition"
                                  title="Восстановить из архива"
                                >
                                  <Icon name="Undo2" size={16} color="#16a34a" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ThreadList;
