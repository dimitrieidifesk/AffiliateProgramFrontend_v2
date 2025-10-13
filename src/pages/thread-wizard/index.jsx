import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import http from 'services/http';

// Yellow decorative figures component
const YellowFigures = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-yellow-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 -left-16 w-24 h-24 bg-yellow-300 rounded-full opacity-30"></div>
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-yellow-400 rounded-full opacity-25"></div>
        <div className="absolute bottom-8 left-8 w-20 h-20 bg-yellow-200 rounded-full opacity-20 animate-bounce"></div>
    </div>
);

const ThreadCreationWizard = () => {
    const navigate = useNavigate();
    const { threadId } = useParams(); // Thread ID after creation
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdThreadId, setCreatedThreadId] = useState(threadId || null);
    const [submitError, setSubmitError] = useState(null);

    // Form data state
    const [formData, setFormData] = useState({
        name: '',
        comment: '',
        source: '',
        status: 'draft',
        persona: 'company', // 'wm' | 'company'
        offer: 'dez', // offer shortname
        offerId: null // numeric offer id if available
    });

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
            channels: ['avito']
        },
        {
            id: 'maps',
            name: 'Карты 2GIS',
            icon: 'Map',
            iconBg: 'bg-purple-500',
            description: 'Размещение в 2GIS картах',
            channels: ['api', 'telephony']
        }
        ,
        {
            id: 'marketplaces',
            name: 'Маркетплейс услуг',
            icon: 'Store',
            iconBg: 'bg-pink-500',
            description: 'Площадки Профи.ру, Яндекс Услуги и др.',
            channels: ['api', 'telephony']
        }
    ];

    const steps = [
        { id: 1, title: 'Основная информация', description: 'Название и описание потока' },
        { id: 2, title: 'Источник трафика', description: 'Выбор канала привлечения' },
        { id: 3, title: 'Создание потока', description: 'Подтверждение и создание' },
        { id: 4, title: 'Настройка каналов', description: 'Подключение интеграций' }
    ];

    const [offers, setOffers] = useState([]);
    const [offersLoading, setOffersLoading] = useState(true);

    const getOfferIconByShortname = (shortname) => {
        switch ((shortname || '').toLowerCase()) {
            case 'dez':
                return 'Shield';
            default:
                return 'Tag';
        }
    };

    useEffect(() => {
        let mounted = true;
        const loadOffers = async () => {
            setOffersLoading(true);
            try {
                const res = await http.get('/api/v2/offers/', { navigate });
                if (res.ok) {
                    const items = Array.isArray(res.data?.items) ? res.data.items : [];
                    const mapped = items.map((it) => ({
                        id: it.offer_id,
                        shortname: it.shortname,
                        title: it.title,
                        description: it.description,
                        icon: getOfferIconByShortname(it.shortname),
                    }));
                    if (mounted) {
                        setOffers(mapped);
                        if (mapped.length > 0) {
                            // If current selection not in list, or not set, default to first
                            const found = mapped.find(o => o.shortname === formData.offer);
                            const next = found || mapped[0];
                            setFormData((prev) => ({ ...prev, offer: next.shortname, offerId: next.id }));
                        }
                    }
                }
            } finally {
                if (mounted) setOffersLoading(false);
            }
        };
        loadOffers();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSidebarToggle = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = async () => {
        if (currentStep === 3) {
            // Create thread
            await createThread();
        } else if (currentStep < steps.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const createThread = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const trafficSourceNameMap = {
                yandex_direct: 'Яндекс директ',
                seo: 'SEO',
                target: 'Таргет',
                avito: 'Авито',
                maps: 'Карты 2GIS',
                marketplaces: 'Маркетплейс услуг',
            };
            const selectedSource = trafficSources.find(s => s.id === formData.source);
            const payload = {
                user_id: 'qqqqqq', // TODO: заменить на реальный user_id из контекста auth
                title: formData.name,
                traffic_source: trafficSourceNameMap[formData.source] || selectedSource?.name || formData.source,
                source_face: formData.persona,
                offer: formData.offer,
                offer_id: formData.offerId,
                comment: (formData.comment || '').trim() ? formData.comment : null,
                direction: 'Все направления',
            };
            const res = await http.post('/api/v2/threads/', payload, { navigate });
            if (res.ok && res.data?.id != null) {
                setCreatedThreadId(res.data.id);
                setCurrentStep(4);
            } else {
                const message = (res.data && (res.data.message || res.data.detail || res.data.error)) || 'Не удалось создать поток';
                setSubmitError(message);
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error creating thread:', err);
            setSubmitError('Ошибка сети. Попробуйте ещё раз.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.name.trim().length > 0;
            case 2:
                return formData.source.length > 0;
            case 3:
                return true;
            default:
                return true;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-black mb-3">Основная информация</h2>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-2xl mx-auto">
                            <div className="space-y-6">
                                {submitError && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                        {submitError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Название потока <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Введите название"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 nav-transition text-base"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Комментарий для операторов
                                    </label>
                                    <textarea
                                        value={formData.comment}
                                        onChange={(e) => handleInputChange('comment', e.target.value)}
                                        placeholder="Инструкции для операторов при обработке лидов"
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 nav-transition text-base resize-none"
                                    />
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs text-gray-500 font-medium">Примеры комментариев:</p>
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-600">• "Компания "Дезинфектор" - услуги дезинфекции"</p>
                                            <p className="text-xs text-gray-600">• "Представиться мастером Дмитрием"</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Кем представиться клиенту?
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleInputChange('persona', 'wm')}
                                            className={`flex items-center p-4 rounded-lg border-2 nav-transition text-left ${
                                                formData.persona === 'wm'
                                                    ? 'border-yellow-400 bg-yellow-50'
                                                    : 'border-gray-200 hover:border-yellow-300'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center mr-3 flex-shrink-0">
                                                <Icon name="User" size={18} color="#111827" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">Частный мастером</div>
                                                <div className="text-sm text-gray-600">Представляться частным мастером</div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleInputChange('persona', 'company')}
                                            className={`flex items-center p-4 rounded-lg border-2 nav-transition text-left ${
                                                formData.persona === 'company'
                                                    ? 'border-yellow-400 bg-yellow-50'
                                                    : 'border-gray-200 hover:border-yellow-300'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center mr-3 flex-shrink-0">
                                                <Icon name="Briefcase" size={18} color="#111827" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">Компания</div>
                                                <div className="text-sm text-gray-600">Представляться от лица компании</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Оффер
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {offersLoading && (
                                            <div className="w-full p-4 rounded-lg border-2 border-gray-200">
                                                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                                                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                                            </div>
                                        )}
                                        {!offersLoading && offers.map((offer) => (
                                            <button
                                                key={offer.id}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, offer: offer.shortname, offerId: offer.id }))}
                                                className={`w-full flex items-center p-4 rounded-lg border-2 nav-transition text-left ${
                                                    formData.offer === offer.shortname
                                                        ? 'border-yellow-400 bg-yellow-50'
                                                        : 'border-gray-200 hover:border-yellow-300'
                                                }`}
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center mr-3 flex-shrink-0">
                                                    <Icon name={offer.icon} size={18} color="#111827" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{offer.title}</div>
                                                    <div className="text-sm text-gray-600">{offer.description}</div>
                                                </div>
                                                {formData.offer === offer.shortname && (
                                                    <div className="ml-auto flex items-center space-x-2 text-yellow-600">
                                                        <Icon name="CheckCircle" size={16} />
                                                        <span className="text-sm font-medium">Выбрано</span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                        {!offersLoading && offers.length === 0 && (
                                            <div className="text-sm text-gray-500">Офферы недоступны</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-black mb-3">Источник трафика</h2>
                            <p className="text-gray-600">Выберите канал привлечения для этого потока</p>
                        </div>

                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {trafficSources.map((source) => (
                                    <div
                                        key={source.id}
                                        onClick={() => handleInputChange('source', source.id)}
                                        className={`
                      bg-white border-2 rounded-xl p-6 cursor-pointer nav-transition hover:shadow-lg
                      ${formData.source === source.id
                                                ? 'border-yellow-400 bg-yellow-50'
                                                : 'border-gray-200 hover:border-yellow-300'
                                            }
                    `}
                                    >
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className={`w-12 h-12 ${source.iconBg} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                                                <Icon
                                                    name={source.icon}
                                                    size={20}
                                                    color={source.icon === 'AvitoLogo' ? '#000000' : 'white'}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-black text-lg">{source.name}</h3>
                                                <p className="text-sm text-gray-600">{source.description}</p>
                                            </div>
                                        </div>

                                        {formData.source === source.id && (
                                            <div className="flex items-center space-x-2 text-yellow-600">
                                                <Icon name="CheckCircle" size={16} />
                                                <span className="text-sm font-medium">Выбрано</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 3:
                const selectedSource = trafficSources.find(s => s.id === formData.source);
                const selectedOffer = offers.find(o => o.shortname === formData.offer);
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-black mb-3">Подтверждение создания</h2>
                            <p className="text-gray-600">Проверьте данные перед созданием потока</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-2xl mx-auto">
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <Icon name="FileText" size={20} color="#6B7280" />
                                    <div>
                                        <h4 className="font-semibold text-black mb-1">Название потока</h4>
                                        <p className="text-gray-700">{formData.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div className={`w-8 h-8 ${selectedSource?.iconBg} rounded-lg flex items-center justify-center shadow-sm`}>
                                        <Icon
                                            name={selectedSource?.icon}
                                            size={16}
                                            color={selectedSource?.icon === 'AvitoLogo' ? '#000000' : 'white'}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-black mb-1">Источник трафика</h4>
                                        <p className="text-gray-700">{selectedSource?.name}</p>
                                        <p className="text-sm text-gray-600 mt-1">{selectedSource?.description}</p>
                                    </div>
                                </div>

                                {formData.comment && (
                                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                        <Icon name="MessageSquare" size={20} color="#6B7280" />
                                        <div>
                                            <h4 className="font-semibold text-black mb-1">Комментарий</h4>
                                            <p className="text-gray-700">{formData.comment}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <Icon name="IdCard" size={20} color="#6B7280" />
                                    <div>
                                        <h4 className="font-semibold text-black mb-1">Представляться как</h4>
                                        <p className="text-gray-700">{formData.persona === 'company' ? 'Компания' : 'Частный мастер (ЧМ)'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <Icon name="Tag" size={20} color="#6B7280" />
                                    <div>
                                        <h4 className="font-semibold text-black mb-1">Оффер</h4>
                                        <p className="text-gray-700">{selectedOffer?.title || '—'}</p>
                                        {formData.offerId && (
                                            <p className="text-xs text-gray-500 mt-1">ID: {formData.offerId} • Код: {formData.offer}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-black mb-3">Поток создан!</h2>
                            <p className="text-gray-600">Теперь настройте каналы для сбора лидов</p>
                        </div>

                        <div className="max-w-2xl mx-auto">


                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                                <h3 className="font-bold text-black mb-4">Доступные каналы</h3>
                                <div className="space-y-3">
                                    {trafficSources.find(s => s.id === formData.source)?.channels?.map((channelType) => (
                                        <div key={channelType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 ${getChannelConfig(channelType).iconBg} rounded-lg flex items-center justify-center`}>
                                                    <Icon name={getChannelConfig(channelType).icon} size={16} color="white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-black">{getChannelConfig(channelType).name}</h4>
                                                    <p className="text-xs text-gray-600">{getChannelConfig(channelType).description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/channel-${channelType}/${createdThreadId}`)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium nav-transition"
                                            >
                                                Настроить →
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/thread-postbacks/${createdThreadId}`)}
                                    className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-semibold nav-transition flex items-center justify-center space-x-2"
                                >
                                    <Icon name="Webhook" size={16} />
                                    <span>Настроить постбеки</span>
                                    <Icon name="ArrowRight" size={14} />
                                </button>

                                <button
                                    onClick={() => navigate('/threads')}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg nav-transition"
                                >
                                    Завершить и перейти к списку потоков
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const getChannelConfig = (channelType) => {
        const configs = {
            api: {
                name: 'API интеграция',
                description: 'Прямая интеграция через API',
                icon: 'Code',
                iconBg: 'bg-blue-500'
            },
            telephony: {
                name: 'Телефония',
                description: 'Отслеживание звонков',
                icon: 'Phone',
                iconBg: 'bg-green-500'
            },
            avito: {
                name: 'Авито',
                description: 'Интеграция с Авито',
                icon: 'AvitoLogo',
                iconBg: 'bg-white border border-gray-300'
            }
        };
        return configs[channelType] || { name: channelType, description: '', icon: 'Globe', iconBg: 'bg-gray-500' };
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
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => navigate('/threads')}
                                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 nav-transition text-sm"
                                >
                                    <Icon name="ArrowLeft" size={14} color="#6B7280" />
                                    <span>К списку потоков</span>
                                </button>
                                <div className="h-5 w-px bg-gray-300"></div>
                                <h1 className="text-2xl font-bold text-black">Создание нового потока</h1>
                            </div>

                            {currentStep < 4 && (
                                <div className="text-sm text-gray-500">
                                    Шаг {currentStep} из {steps.length}
                                </div>
                            )}
                        </div>

                        {/* Progress bar */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                {steps.map((step, index) => (
                                    <div key={step.id} className="flex items-center">
                                        <div className="flex items-center">
                                            <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm nav-transition
                        ${currentStep >= step.id
                                                    ? 'bg-yellow-400 text-black'
                                                    : 'bg-gray-200 text-gray-500'
                                                }
                      `}>
                                                {currentStep > step.id ? (
                                                    <Icon name="Check" size={16} />
                                                ) : (
                                                    step.id
                                                )}
                                            </div>
                                            <div className="ml-3 hidden md:block">
                                                <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-black' : 'text-gray-500'}`}>
                                                    {step.title}
                                                </p>
                                                <p className="text-xs text-gray-500">{step.description}</p>
                                            </div>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`
                        w-12 h-px mx-4 nav-transition
                        ${currentStep > step.id ? 'bg-yellow-400' : 'bg-gray-300'}
                      `}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="mb-8">
                        {renderStep()}
                    </div>

                    {/* Navigation */}
                    {currentStep < 4 && (
                        <div className="flex justify-between max-w-4xl mx-auto">
                            <button
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                                className={`
                  flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg font-semibold nav-transition
                  ${currentStep === 1
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }
                `}
                            >
                                <Icon name="ArrowLeft" size={16} />
                                <span>Назад</span>
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={!canProceed() || isSubmitting}
                                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold nav-transition text-white
                  ${canProceed() && !isSubmitting
                                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 shadow-lg transform hover:scale-105 active:scale-95'
                                        : 'bg-gray-400 cursor-not-allowed'
                                    }
                `}
                            >
                                {isSubmitting && <Icon name="Loader2" size={16} className="animate-spin" />}
                                <span>
                                    {currentStep === 3 ? 'Создать поток' : 'Далее'}
                                </span>
                                {!isSubmitting && <Icon name="ArrowRight" size={16} />}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ThreadCreationWizard;
