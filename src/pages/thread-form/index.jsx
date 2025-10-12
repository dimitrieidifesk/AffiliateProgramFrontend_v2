import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import http from 'services/http';

const ThreadForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const isEdit = Boolean(id);
    const isView = mode === 'view';

    const [formData, setFormData] = useState({
        name: '',
        comment: '',
        source: '',
        postbacks: {
            // 'В работе': { url: '', enabled: false },
            // 'Назначено': { url: '', enabled: false },
            // 'Подтвержден': { url: '', enabled: false },
            // 'Отказ клиента': { url: '', enabled: false },
            // 'Некачественный': { url: '', enabled: false }
        },
        channels: {
            api: {
                connected: false,
                status: 'not_connected', // not_connected, pending, connected
                config: {
                    url: '',
                    testResponse: null
                }
            },
            telephony: {
                connected: false,
                status: 'not_connected', // not_connected, pending, connected
                config: {
                    phoneNumber: '',
                    connectionDate: null
                }
            },
            avito: {
                connected: false,
                status: 'not_connected', // not_connected, pending, connected
                config: {
                    accountId: '',
                    connectionDate: null
                }
            }
        }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState({ title: '', comment: '' });
    const [hasLoadedData, setHasLoadedData] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [autoSaveError, setAutoSaveError] = useState(null);

    // Traffic sources configuration
    const trafficSources = [
        {
            id: 'yandex_direct',
            name: 'Яндекс Директ',
            icon: 'Search',
            iconBg: 'bg-red-500',
            description: 'Контекстная реклама в Яндекс',
            channels: ['api', 'telephony']
        },
        {
            id: 'seo',
            name: 'SEO',
            icon: 'TrendingUp',
            iconBg: 'bg-green-500',
            description: 'Поисковая оптимизация',
            channels: ['api', 'telephony']
        },
        {
            id: 'target',
            name: 'Таргет',
            icon: 'Target',
            iconBg: 'bg-blue-500',
            description: 'Таргетированная реклама',
            channels: ['api', 'telephony']
        },
        {
            id: 'avito',
            name: 'Авито',
            icon: 'AvitoLogo',
            iconBg: 'bg-white border border-gray-300',
            description: 'Платформа объявлений',
            channels: ['avito'] // Only Avito channel required
        },
        {
            id: 'maps',
            name: 'Карты 2GIS',
            icon: 'Map',
            iconBg: 'bg-purple-500',
            description: 'Размещение в 2GIS картах',
            channels: ['api', 'telephony']
        }
    ];

    // Map backend traffic_source name to internal id used in UI
    const mapTrafficSourceNameToId = (name) => {
        const n = (name || '').toLowerCase().trim();
        if (n.includes('яндекс') && n.includes('директ')) return 'yandex_direct';
        if (n === 'seo') return 'seo';
        if (n.includes('таргет')) return 'target';
        if (n.includes('авито')) return 'avito';
        if (n.includes('карты') || n.includes('2gis') || n.includes('2 gis')) return 'maps';
        return '';
    };

    // Transform statuses_postback_urls {"1":"url",...} to existing UI shape
    const mapPostbacksFromBackend = (statusesObj) => {
        const result = {};
        const map = {
            '1': 'В работе',
            '2': 'Назначено',
            '3': 'Подтвержден',
            '4': 'Отказ клиента',
            '5': 'Некачественный',
        };
        if (statusesObj && typeof statusesObj === 'object') {
            Object.entries(map).forEach(([key, label]) => {
                const url = (statusesObj?.[key] || '').trim();
                if (url) {
                    result[label] = { url, enabled: true };
                }
            });
        }
        return result;
    };

    const mapTelephonyStatus = (s) => {
        const v = (s || '').toLowerCase();
        if (v === 'connected') return 'connected';
        if (v === 'waiting' || v === 'error') return 'pending';
        return 'not_connected'; // 'none' and any other
    };

    // Load existing thread data for editing
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (isEdit && id) {
                try {
                    const res = await http.get(`/api/v2/threads/${id}`, { navigate });
                    if (!mounted) return;
                    if (res.ok && res.data) {
                        const data = res.data;
                        const sourceId = mapTrafficSourceNameToId(data.traffic_source);
                        const form = {
                            name: data.title || '',
                            comment: data.comment || '',
                            source: sourceId,
                            postbacks: mapPostbacksFromBackend(data.statuses_postback_urls),
                            channels: {
                                api: {
                                    connected: Boolean(data.wh_client_phone_pathname),
                                    status: data.wh_client_phone_pathname ? 'connected' : 'not_connected',
                                    config: {},
                                },
                                telephony: {
                                    connected: mapTelephonyStatus(data.telephony_connect_status) === 'connected',
                                    status: mapTelephonyStatus(data.telephony_connect_status),
                                    config: {
                                        phoneNumber: data.telephony_virtual_phone || '',
                                        connectionDate: null,
                                    },
                                },
                                avito: {
                                    connected: Boolean(data.avito_account_id),
                                    status: data.avito_account_id ? 'connected' : 'not_connected',
                                    config: {
                                        accountId: data.avito_account_id || '',
                                        connectionDate: data.avito_connect_date || null,
                                    },
                                },
                            },
                        };
                        setFormData(form);
                        setLastSaved({ title: form.name || '', comment: form.comment || '' });
                        setHasLoadedData(true);
                    } else {
                        // Non-OK: keep defaults
                        // Optionally, show a toast/error in future
                    }
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('Failed to load thread', e);
                }
            }
        };
        load();
        return () => { mounted = false; };
    }, [id, isEdit, navigate]);

    // Debounced auto-save for title/comment when editing existing thread
    useEffect(() => {
        if (!isEdit || !id || !hasLoadedData) return;
        const handler = setTimeout(async () => {
            const nameTrim = (formData?.name || '').trim();
            const currentComment = formData?.comment ?? '';

            const patch = {};
            if (nameTrim && nameTrim !== (lastSaved.title || '')) {
                patch.title = nameTrim;
            }
            if (currentComment !== (lastSaved.comment ?? '')) {
                patch.comment = (currentComment || '').trim() ? currentComment : null;
            }

            if (Object.keys(patch).length === 0) return;

            try {
                setIsAutoSaving(true);
                setAutoSaveError(null);
                const res = await http.patch(`/api/v2/threads/${id}`, patch, { navigate });
                if (res.ok) {
                    setLastSaved(prev => ({
                        title: patch.title !== undefined ? patch.title : prev.title,
                        comment: patch.comment !== undefined ? (patch.comment ?? '') : prev.comment,
                    }));
                } else {
                    setAutoSaveError(res.data?.message || res.data?.detail || 'Не удалось сохранить изменения');
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Auto-save failed', e);
                setAutoSaveError('Ошибка сети при сохранении');
            } finally {
                setIsAutoSaving(false);
            }
        }, 700);

        return () => clearTimeout(handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData?.name, formData?.comment, isEdit, id, hasLoadedData, lastSaved.title, lastSaved.comment]);

    const handleSidebarToggle = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSourceSelect = (sourceId) => {
        setFormData(prev => ({
            ...prev,
            source: sourceId
        }));
    };

    // Get available channels for selected source
    const getAvailableChannels = () => {
        const source = trafficSources?.find(s => s?.id === formData?.source);
        return source ? source?.channels : [];
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setIsSubmitting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(isEdit ? 'Updating thread:' : 'Creating thread:', formData);
            navigate('/threads');
        } catch (error) {
            console.error('Error saving thread:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get postback status for display
    const getPostbackStatus = () => {
        const enabledPostbacks = Object.values(formData?.postbacks || {}).filter(pb => pb?.enabled && pb?.url?.trim());
        const totalStatuses = 5; // В работе, Назначено, Подтвержден, Отказ клиента, Некачественный

        if (enabledPostbacks.length === 0) {
            return {
                text: 'Не настроено',
                dotColor: 'bg-gray-400',
                bgColor: 'bg-gray-100 text-gray-800'
            };
        } else if (enabledPostbacks.length === totalStatuses) {
            return {
                text: 'Полностью настроено',
                dotColor: 'bg-green-500',
                bgColor: 'bg-green-100 text-green-800'
            };
        } else {
            return {
                text: 'Частично настроено',
                dotColor: 'bg-yellow-500',
                bgColor: 'bg-yellow-100 text-yellow-800'
            };
        }
    };

    // Yellow decorative figures component
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
            <div className="absolute top-28 left-8 w-11 h-11 bg-yellow-200 rounded-full opacity-15 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '3.5s' }}></div>
            <div className="absolute top-52 left-24 w-8 h-8 bg-yellow-300 transform rotate-12 opacity-20 animate-pulse" style={{ animationDelay: '1.3s' }}></div>
            <div className="absolute top-20 left-48 w-16 h-7 bg-yellow-400 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '2.1s', animationDuration: '4.5s' }}></div>
            <div className="absolute top-72 left-12 w-4 h-12 bg-yellow-300 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '0.8s' }}></div>
            <div className="absolute top-36 left-64 w-5 h-10 bg-yellow-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2.8s' }}></div>
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
                <div className="p-4 w-full">
                    {/* Page Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => navigate('/threads')}
                                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 nav-transition text-sm"
                                >
                                    <Icon name="ArrowLeft" size={14} color="#6B7280" />
                                    <span>Назад</span>
                                </button>
                                <div className="h-5 w-px bg-gray-300"></div>
                                <h1 className="text-2xl font-bold text-black flex items-center">
                                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                                        <Icon name="GitBranch" size={18} color="white" />
                                    </div>
                                    Поток
                                </h1>
                            </div>
                            <div className="flex items-center space-x-3">
                                {!isView && !isEdit && formData?.name?.trim() && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !formData?.name?.trim()}
                                        className={`
                      flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-lg font-semibold transform hover:scale-105 active:scale-95 nav-transition shadow-lg text-sm
                      ${(isSubmitting || !formData?.name?.trim()) ? 'opacity-50 cursor-not-allowed transform-none' : ''}
                    `}
                                    >
                                        {isSubmitting && <Icon name="Loader2" size={16} className="animate-spin" />}
                                        <span>{isEdit ? 'Сохранить' : 'Создать'}</span>
                                    </button>
                                )}
                                {isEdit && (
                                    <div className="text-xs text-gray-500">
                                        {isAutoSaving ? (
                                            <span className="flex items-center space-x-1"><Icon name="Loader2" size={12} className="animate-spin" /><span>Сохранение…</span></span>
                                        ) : autoSaveError ? (
                                            <span className="text-red-600">Не удалось сохранить</span>
                                        ) : (
                                            <span>Все изменения сохранены</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content - полная ширина */}
                    <div className="w-full space-y-6">
                        {/* Basic Thread Information - компактная версия */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Название потока <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData?.name}
                                        onChange={(e) => handleInputChange('name', e?.target?.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm nav-transition"
                                        placeholder="Например: Недвижимость Москва"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Источник трафика <span className="text-red-500">*</span>
                                    </label>
                                    {formData?.source ? (
                                        <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-6 h-6 ${trafficSources?.find(s => s?.id === formData?.source)?.iconBg} rounded-md flex items-center justify-center`}>
                                                    <Icon
                                                        name={trafficSources?.find(s => s?.id === formData?.source)?.icon}
                                                        size={12}
                                                        color={trafficSources?.find(s => s?.id === formData?.source)?.icon === 'AvitoLogo' ? '#000000' : 'white'}
                                                    />
                                                </div>
                                                <span className="font-semibold text-black text-sm">
                                                    {trafficSources?.find(s => s?.id === formData?.source)?.name}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={formData?.source}
                                                onChange={(e) => handleSourceSelect(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm nav-transition appearance-none bg-white"
                                                disabled={isView}
                                            >
                                                <option value="">Выберите источник</option>
                                                {trafficSources?.map((source) => (
                                                    <option key={source?.id} value={source?.id}>
                                                        {source?.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                <Icon name="ChevronDown" size={16} color="#6B7280" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Комментарий (опционально)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData?.comment}
                                        onChange={(e) => handleInputChange('comment', e?.target?.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm nav-transition"
                                        placeholder="Краткое описание..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Postbacks Configuration */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                                        <Icon name="Webhook" size={14} color="white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-black">Постбеки</h2>
                                        <p className="text-xs text-gray-500">HTTP запросы при изменении статусов лидов</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${getPostbackStatus().dotColor}`}></div>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPostbackStatus().bgColor}`}>
                                                {getPostbackStatus().text}
                                            </span>
                                        </div>
                                        {formData?.postbacks && Object.keys(formData?.postbacks).length > 0 && (
                                            <p className="text-xs text-gray-600">
                                                Настроено {Object.keys(formData?.postbacks).length} из 5 статусов
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => navigate(`/thread-postbacks/${id || 'new'}`)}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg nav-transition font-semibold shadow-sm text-sm"
                                    >
                                        Настроить →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Traffic Channels */}
                        {formData?.source && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-xl font-bold text-black mb-6 flex items-center">
                                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                                        <Icon name="Settings" size={16} color="white" />
                                    </div>
                                    Каналы трафика
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {getAvailableChannels()?.includes('api') && (
                                        <ChannelCard
                                            id="api"
                                            title="API"
                                            description="Интеграция для получения лидов"
                                            icon="Code"
                                            iconBg="bg-blue-600"
                                            status={formData?.channels?.api?.status}
                                            config={formData?.channels?.api?.config}
                                            onNavigate={() => navigate(`/channel-api/${id || 'new'}`)}
                                        />
                                    )}

                                    {getAvailableChannels()?.includes('telephony') && (
                                        <ChannelCard
                                            id="telephony"
                                            title="Телефония"
                                            description="Трекинг звонков и номеров"
                                            icon="Phone"
                                            iconBg="bg-green-600"
                                            status={formData?.channels?.telephony?.status}
                                            config={formData?.channels?.telephony?.config}
                                            onNavigate={() => navigate(`/channel-telephony/${id || 'new'}`)}
                                        />
                                    )}

                                    {getAvailableChannels()?.includes('avito') && (
                                        <ChannelCard
                                            id="avito"
                                            title="Авито"
                                            description="Интеграция с аккаунтом"
                                            icon="AvitoLogo"
                                            iconBg="bg-white border-2 border-gray-200"
                                            status={formData?.channels?.avito?.status}
                                            config={formData?.channels?.avito?.config}
                                            onNavigate={() => navigate(`/channel-avito/${id || 'new'}`)}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

// Channel Card Component
const ChannelCard = ({ id, title, description, icon, iconBg, status, config, onNavigate }) => {
    const getStatusInfo = () => {
        switch (status) {
            case 'connected':
                return { text: 'Подключено', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' };
            case 'pending':
                return { text: 'На рассмотрении', color: 'bg-yellow-100 text-yellow-800', dotColor: 'bg-yellow-500' };
            default:
                return { text: 'Не подключено', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-400' };
        }
    };

    const statusInfo = getStatusInfo();

    const renderConfigInfo = () => {
        if (status !== 'connected') return null;

        switch (id) {
            case 'telephony':
                return (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-green-800 mb-1">
                            <Icon name="CheckCircle" size={12} color="#16a34a" />
                            <span className="font-semibold text-xs">Номер активен</span>
                        </div>
                        <p className="text-xs text-green-700">
                            <strong>{config?.phoneNumber}</strong>
                        </p>
                    </div>
                );
            case 'avito':
                return (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-green-800 mb-1">
                            <Icon name="CheckCircle" size={12} color="#16a34a" />
                            <span className="font-semibold text-xs">Привязан</span>
                        </div>
                        <p className="text-xs text-green-700">
                            ID: <strong>{config?.accountId}</strong>
                        </p>
                        <p className="text-xs text-green-600">
                            от {config?.connectionDate}
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-yellow-300 nav-transition bg-white h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon name={icon} size={18} color={icon === 'AvitoLogo' ? '#000000' : 'white'} />
                </div>
                <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}></div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <h3 className="font-bold text-black text-base mb-2">{title}</h3>
                <p className="text-xs text-gray-600 mb-3">{description}</p>
                {renderConfigInfo()}
            </div>

            <button
                onClick={onNavigate}
                className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg nav-transition font-semibold shadow-sm text-sm"
            >
                Настроить →
            </button>
        </div>
    );
};

export default ThreadForm;
