import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/ui/Header';
import Icon from 'components/AppIcon';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import http from 'services/http';
import { getCurrentUserId } from 'utils/auth';

// Components
import KPICard from './components/KPICard';

const Dashboard = () => {
  const navigate = useNavigate();
  // Sidebar removed globally; state deprecated
  const [sidebarCollapsed] = useState(false);
  const [userRole, setUserRole] = useState('webmaster');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [animationClass, setAnimationClass] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [trafficSources, setTrafficSources] = useState([]);
  const [loadingTraffic, setLoadingTraffic] = useState(false);
  const [trafficError, setTrafficError] = useState(null);
  const [leadStatusData, setLeadStatusData] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [statusesError, setStatusesError] = useState(null);
  const [citiesData, setCitiesData] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState(null);

  // Enhanced animation effects
  useEffect(() => {
    setAnimationClass('animate-fade-in');
    const timer = setTimeout(() => {
      setStatsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Mock user data for Leadmaker partner program
  const mockUser = {
    name: "Alex Petrov",
    email: "alex.petrov@leadmaker.pro",
    role: "Senior Webmaster",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  };

  // Format currency (hoisted function to avoid TDZ issues in useMemo)
  function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount ?? 0));
  }

  // Period -> date range helper (inclusive, ending today)
  const computePeriodRange = (period) => {
    const today = new Date();
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const from = new Date(to);
    if (period === '7d') from.setDate(to.getDate() - 6);
    else if (period === '30d') from.setDate(to.getDate() - 29);
    else if (period === '90d') from.setDate(to.getDate() - 89);
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { created_from: `${fmt(from)}T00:00:00`, created_to: `${fmt(to)}T00:00:00` };
  };

  // Helper to truncate thread titles for axis labels
  const truncateTitle = (str, max = 16) => {
    if (!str) return '';
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
  };

  // Load dashboard summary from backend (date-only filters by selected period)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingSummary(true);
      setSummaryError(null);
      try {
        const { created_from, created_to } = computePeriodRange(selectedPeriod);
        const userId = getCurrentUserId();
        const params = new URLSearchParams();
        params.append('created_from', created_from);
        params.append('created_to', created_to);
        if (userId) params.append('user_id', userId);
        const url = `/api/v2/leads/stats/dashboard_summary?${params.toString()}`;
        const { ok, data } = await http.get(url, { navigate });
        if (cancelled) return;
        if (ok && data && typeof data === 'object') setSummary(data);
        else setSummary(null);
      } catch (e) {
        if (!cancelled) { setSummary(null); setSummaryError('Не удалось загрузить сводку'); }
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedPeriod, navigate]);

  // Load geography by cities (by-cities) with user_id
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingCities(true);
      setCitiesError(null);
      try {
        const { created_from, created_to } = computePeriodRange(selectedPeriod);
        const userId = getCurrentUserId();
        const params = new URLSearchParams();
        params.append('created_from', created_from);
        params.append('created_to', created_to);
        params.append('with_detail', 'true');
        if (userId) params.append('user_id', userId);
        const url = `/api/v2/leads/stats/by-cities?${params.toString()}`;
        const { ok, data } = await http.get(url, { navigate });
        if (cancelled) return;
        const rows = ok && Array.isArray(data) ? data : [];
        const normalized = rows.map(r => ({
          city: r?.city || 'Нет города',
          leads: Number(r?.total ?? 0),
          percent: Number(r?.conversion_percent ?? 0),
          revenue: Number(r?.commission_confirmed_sum ?? 0),
        }))
        .filter(x => x.leads > 0 || x.revenue > 0 || x.percent > 0)
  .sort((a,b) => b.leads - a.leads)
  .slice(0, 8);
        setCitiesData(normalized);
      } catch (e) {
        if (!cancelled) { setCitiesData([]); setCitiesError('Не удалось загрузить географию'); }
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedPeriod, navigate]);

  // Load lead statuses distribution (by-service-status)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingStatuses(true);
      setStatusesError(null);
      try {
        const { created_from, created_to } = computePeriodRange(selectedPeriod);
        const userId = getCurrentUserId();
        const params = new URLSearchParams();
        params.append('created_from', created_from);
        params.append('created_to', created_to);
        if (userId) params.append('user_id', userId);
        const url = `/api/v2/leads/stats/by-service-status?${params.toString()}`;
        const { ok, data } = await http.get(url, { navigate });
        if (cancelled) return;
        const rows = ok && Array.isArray(data) ? data : [];

        // Colors aligned with getStatusBadge (Tailwind 500 equivalents)
        // in_work -> blue-500, assigned -> yellow-500, confirmed -> green-500,
        // client_refusal -> red-500, low_quality -> gray-500
        const colorById = {
          1: '#3b82f6', // В работе (in_work)
          2: '#eab308', // Назначено (assigned)
          3: '#22c55e', // Подтвержден (confirmed)
          4: '#ef4444', // Отказ клиента (client_refusal)
          5: '#6b7280', // Некачественный (low_quality)
        };

        const mapped = rows.map(r => {
          const id = Number(r?.service_status_id);
          return {
            service_status_id: id,
            status: String(r?.status || ''),
            count: Number(r?.total ?? 0),
            color: colorById[id] || '#BDBDBD',
          };
        });
        setLeadStatusData(mapped);
      } catch (e) {
        if (!cancelled) { setLeadStatusData([]); setStatusesError('Не удалось загрузить статусы'); }
      } finally {
        if (!cancelled) setLoadingStatuses(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedPeriod, navigate]);

  // Load traffic sources (by-threads) with user_id; map thread_id -> title
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingTraffic(true);
      setTrafficError(null);
      try {
        const { created_from, created_to } = computePeriodRange(selectedPeriod);
        const userId = getCurrentUserId();
        // Build URLs
        const paramsStats = new URLSearchParams();
        paramsStats.append('start', created_from);
        paramsStats.append('finish', created_to);
        if (userId) paramsStats.append('user_id', userId);
        const statsUrl = `/api/v2/leads/stats/by-threads?${paramsStats.toString()}`;

        const paramsThreads = new URLSearchParams();
        if (userId) paramsThreads.append('user_id', userId);
        paramsThreads.append('limit', '500');
        const threadsUrl = `/api/v2/threads/?${paramsThreads.toString()}`;

        // Fetch in parallel
        const [statsRes, threadsRes] = await Promise.all([
          http.get(statsUrl, { navigate }),
          http.get(threadsUrl, { navigate })
        ]);

        if (cancelled) return;

        const stats = Array.isArray(statsRes?.data) ? statsRes.data : [];
        const items = Array.isArray(threadsRes?.data?.items) ? threadsRes.data.items : [];

  const itemMap = new Map(items.map(it => [Number(it?.id), it]));

        const chartData = stats.map(row => {
          const id = Number(row?.thread_id);
          const thread = itemMap.get(id);
          const fullTitle = (thread?.title ? String(thread.title) : null) || `Поток #${id}`;
          return {
            thread_id: id,
            fullTitle,
            source: truncateTitle(fullTitle, 18),
            leads: Number(row?.total ?? 0),
            traffic_source: thread?.traffic_source ? String(thread.traffic_source) : undefined,
          };
        });

        setTrafficSources(chartData);
      } catch (e) {
        if (!cancelled) {
          setTrafficSources([]);
          setTrafficError('Не удалось загрузить источники трафика');
        }
      } finally {
        if (!cancelled) setLoadingTraffic(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedPeriod, navigate]);

  // Format percent diff with sign
  const formatDiff = (v) => {
    const num = Number(v ?? 0);
    const sign = num > 0 ? '+' : (num < 0 ? '-' : '');
    return `${sign}${Math.abs(num).toFixed(1)}%`;
  };

  // Enhanced KPI data driven by backend summary
  const kpiData = useMemo(() => {
    const curr = summary?.current || {};
    const diff = summary?.diff_percent || {};
    return [
      {
        id: 1,
        title: 'Все лиды',
        value: String(Number(curr?.total ?? 0)),
        change: formatDiff(diff?.total),
        trend: Number(diff?.total ?? 0) >= 0 ? 'up' : 'down',
        icon: 'Users',
        color: 'success',
        description: 'Количество Ваших лидов за период',
        pulse: true,
      },
      {
        id: 2,
        title: 'Заработано',
        value: formatCurrency(Number(curr?.commission_confirmed_sum ?? 0)),
        change: formatDiff(diff?.commission_confirmed_sum),
        trend: Number(diff?.commission_confirmed_sum ?? 0) >= 0 ? 'up' : 'down',
        icon: 'DollarSign',
        color: 'warning',
        description: 'Общий доход за период',
        pulse: false,
      },
      {
        id: 3,
        title: 'В холде',
        value: formatCurrency(Number(curr?.commission_hold_sum ?? 0)),
        change: formatDiff(diff?.commission_hold_sum),
        trend: Number(diff?.commission_hold_sum ?? 0) >= 0 ? 'up' : 'down',
        icon: 'Clock',
        color: 'secondary',
        description: 'Сумма на удержании',
        pulse: false,
      },
      {
        id: 4,
        title: 'Конверсия',
        value: `${Number(curr?.conversion_percent ?? 0).toFixed(1)}%`,
        change: formatDiff(diff?.conversion_percent),
        trend: Number(diff?.conversion_percent ?? 0) >= 0 ? 'up' : 'down',
        icon: 'Target',
        color: 'primary',
        description: 'Общая конверсия лидов',
        pulse: true,
      },
    ];
  }, [summary]);

  // trafficSources now loaded from backend

  // citiesData now loaded from backend

  // leadStatusData now loaded from backend

  // Financial Trends
  const financialTrends = [
    { month: 'Янв', earned: 65000, paid: 58000, pending: 7000 },
    { month: 'Фев', earned: 72000, paid: 65000, pending: 7000 },
    { month: 'Мар', earned: 68000, paid: 68000, pending: 0 },
    { month: 'Апр', earned: 78000, paid: 70000, pending: 8000 },
    { month: 'Май', earned: 85000, paid: 78000, pending: 7000 },
    { month: 'Июн', earned: 89450, paid: 82000, pending: 7450 }
  ];

  const handleSidebarToggle = () => {};

  const handleLogout = () => {
    navigate('/login');
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setAnimationClass('animate-pulse');
    setTimeout(() => setAnimationClass(''), 500);
  };

  // Enhanced yellow decorative figures for dashboard
  const YellowFigures = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Core ambient shapes */}
      <div className="absolute top-28 right-8 w-32 h-32 bg-yellow-primary/10 rounded-full animate-float" />
      <div className="absolute bottom-16 left-8 w-24 h-24 bg-black/5 rounded-full animate-float-delayed" />
      {/* Left top cluster to replace removed header visual weight */}
      <div className="absolute top-14 left-6 w-28 h-28 bg-yellow-300/25 rounded-full blur-2xl" />
      <div className="absolute top-10 left-40 w-16 h-16 bg-yellow-200/20 rounded-full blur-xl" />
      <div className="absolute top-24 left-24 w-10 h-10 bg-yellow-400/30 rounded-full animate-pulse" style={{ animationDuration: '5s' }} />
      {/* Subtle micro accents */}
      <div className="absolute top-36 right-64 w-6 h-6 bg-yellow-400/25 rounded-full animate-bounce" style={{ animationDuration: '6s' }} />
      <div className="absolute top-20 right-40 w-8 h-3 bg-yellow-500/20 rounded-full animate-float" />
    </div>
  );

  // Custom tooltip for traffic sources chart
  const TrafficTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload || {};
    return (
      <div className="rounded-lg border-2 border-yellow-400 bg-white shadow-lg p-2 min-w-[200px]">
        <div className="text-xs text-text-secondary mb-1">Источник</div>
        <div className="text-sm font-semibold text-text-primary mb-1" title={d.fullTitle}>{d.fullTitle}</div>
        {d.traffic_source && (
          <div className="text-xs text-text-secondary mb-2">Трафик: <span className="font-medium text-text-primary">{d.traffic_source}</span></div>
        )}
        <div className="text-xs"><span className="font-medium">Лиды:</span> {d.leads}</div>
      </div>
    );
  };

  // Custom tooltip for lead statuses pie chart
  const StatusTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload || {};
    const color = payload[0]?.payload?.color || '#FFD600';
    return (
      <div className="rounded-lg border-2 border-yellow-400 bg-white shadow-lg p-2 min-w-[180px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-text-primary">{d.status}</span>
        </div>
        <div className="text-xs"><span className="font-medium">Лиды:</span> {d.count}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-leadmaker-pattern relative overflow-hidden">
      <YellowFigures />

      <Header user={mockUser} />
      <main className="nav-transition relative z-10">
        <div className="p-2 w-full">
          {/* Control Bar (no title) */}
          <div className={`mb-2 ${animationClass}`}>
            <div className="flex flex-row items-center justify-end gap-2">
              <div className="flex items-center bg-white border border-border rounded-lg p-1">
                {[
                  { id: '7d', label: '7д' },
                  { id: '30d', label: '30д' },
                  { id: '90d', label: '90д' }
                ].map(btn => {
                  const active = selectedPeriod === btn.id;
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => handlePeriodChange(btn.id)}
                      className={`px-3 h-8 text-xs font-medium rounded-md nav-transition focus:outline-none focus:ring-2 focus:ring-yellow-400
                        ${active
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-sm'
                          : 'text-text-secondary hover:text-gray-900 hover:bg-yellow-50'}
                      `}
                      aria-pressed={active}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Enhanced KPI Cards with Animations */}
          <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 mb-3 ${statsVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            {kpiData?.map((kpi, index) => (
              <div 
                key={kpi?.id} 
                className="transform hover:scale-105 nav-transition"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <KPICard data={kpi} />
              </div>
            ))}
          </div>

          {/* Enhanced Analytics Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3">
            {/* Enhanced Traffic Sources */}
            <div className="bg-surface rounded-lg border border-border p-3 shadow-card hover:shadow-card-hover nav-transition transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center">
                    <Icon name="TrendingUp" size={18} color="#FFD600" className="mr-2" />
                    Источники трафика
                  </h3>
                  <p className="text-sm text-text-secondary">Распределение лидов по каналам привлечения</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 rounded hover:bg-yellow-50 nav-transition group">
                    <Icon name="RefreshCw" size={14} color="#757575" className="group-hover:rotate-180 nav-transition" />
                  </button>
                  <button className="p-1 rounded hover:bg-yellow-50 nav-transition">
                    <Icon name="MoreHorizontal" size={14} color="#757575" />
                  </button>
                </div>
              </div>
              <div className="h-72">
                {loadingTraffic ? (
                  <div className="h-full flex items-center justify-center text-text-secondary">
                    <Icon name="Loader2" className="animate-spin mr-2" /> Загрузка…
                  </div>
                ) : trafficError ? (
                  <div className="h-full flex items-center justify-center text-red-600 text-sm">{trafficError}</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trafficSources} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="source" stroke="#757575" fontSize={11} />
                    <YAxis stroke="#757575" fontSize={11} />
                    <Tooltip cursor={false} content={<TrafficTooltip />} />
                    <Bar 
                      dataKey="leads" 
                      fill="#FFD600"
                      maxBarSize={48}
                      radius={[3, 3, 0, 0]}
                      name="Лиды"
                      className="hover:opacity-80 cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Enhanced Lead Status Distribution */}
            <div className="bg-surface rounded-lg border border-border p-3 shadow-card hover:shadow-card-hover nav-transition transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center">
                    <Icon name="PieChart" size={18} color="#FFD600" className="mr-2" />
                    Статусы лидов
                  </h3>
                  <p className="text-sm text-text-secondary">Распределение лидов по статусам</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 rounded hover:bg-yellow-50 nav-transition">
                    <Icon name="MoreHorizontal" size={14} color="#757575" />
                  </button>
                </div>
              </div>
              <div className="h-72">
                {loadingStatuses ? (
                  <div className="h-full flex items-center justify-center text-text-secondary">
                    <Icon name="Loader2" className="animate-spin mr-2" /> Загрузка…
                  </div>
                ) : statusesError ? (
                  <div className="h-full flex items-center justify-center text-red-600 text-sm">{statusesError}</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="status"
                      className="cursor-pointer"
                    >
                      {leadStatusData?.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry?.color} 
                          className="hover:opacity-80 nav-transition"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<StatusTooltip />} />
                    <Legend formatter={(value, entry) => entry?.payload?.status || value} />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Geography Section */}
          <div className="bg-surface rounded-lg border border-border p-3 mb-3 shadow-card hover:shadow-card-hover nav-transition">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center">
                  <Icon name="MapPin" size={18} color="#FFD600" className="mr-2" />
                  География лидов
                </h3>
                <p className="text-sm text-text-secondary">Распределение лидов по городам и регионам</p>
              </div>
            </div>
            <div className="min-h-[184px]">
              {loadingCities ? (
                <div className="h-44 flex items-center justify-center text-text-secondary">
                  <Icon name="Loader2" className="animate-spin mr-2" /> Загрузка…
                </div>
              ) : citiesError ? (
                <div className="h-44 flex items-center justify-center text-red-600 text-sm">{citiesError}</div>
              ) : citiesData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-text-secondary text-sm">Нет данных</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {citiesData?.map((city, index) => (
                    <div key={index} className="text-center group cursor-pointer">
                      <div className="bg-gradient-secondary text-black rounded-lg p-3 mb-2 transform group-hover:scale-105 nav-transition shadow-card group-hover:shadow-card-hover">
                        <div className="text-xl font-bold">{city?.leads}</div>
                        <div className="text-xs opacity-80">лидов</div>
                      </div>
                      <div className="text-sm font-medium text-text-primary group-hover:text-yellow-primary nav-transition" title={city?.city}>{city?.city}</div>
                      <div className="text-xs text-text-secondary">конв. {(Number(city?.percent) || 0).toFixed(1)}%</div>
                      <div className="text-xs text-text-secondary font-medium">выплачено {formatCurrency(city?.revenue)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;