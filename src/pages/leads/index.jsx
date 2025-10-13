import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from 'components/ui/Sidebar';
import Icon from 'components/AppIcon';
import DateRangeCompact from 'components/filters/DateRangeCompact';
import MultiCitySelect from 'components/filters/MultiCitySelect';
import FlowsPicker from 'components/filters/FlowsPicker';
import StatusToggle from 'components/filters/StatusToggle';
import { useDebouncedValue } from 'components/filters/useDebouncedValue';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import http from 'services/http';
import citiesRaw from './cities.txt?raw';
import { getCurrentUserId } from 'utils/auth';

export default function LeadsList() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Initialize date range to last 30 days by default
  const computeLast30 = () => {
    const today = new Date();
    const to = today;
    const from = new Date(today);
    from.setDate(today.getDate() - 29);
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { from: fmt(from), to: fmt(to), preset: 'month' };
  };
  const [globalFilters, setGlobalFilters] = useState(() => ({ date: computeLast30(), cities: [], flows: [] }));
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [leads, setLeads] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState(null);
  // Dynamics chart state
  const [dynamicsRows, setDynamicsRows] = useState([]);
  const [loadingDynamics, setLoadingDynamics] = useState(false);
  const [dynamicsError, setDynamicsError] = useState(null);
  // Threads distribution (by-threads) state
  const [threadsStatsRows, setThreadsStatsRows] = useState([]);
  const [loadingThreadsStats, setLoadingThreadsStats] = useState(false);
  const [threadsStatsError, setThreadsStatsError] = useState(null);
  // Cities distribution (by-cities) state
  const [citiesStatsRows, setCitiesStatsRows] = useState([]);
  const [loadingCitiesStats, setLoadingCitiesStats] = useState(false);
  const [citiesStatsError, setCitiesStatsError] = useState(null);

  // Summary KPIs (top cards)
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Backend flows (threads) used for filters; fallback mock for initial render and mock leads
  const [backendFlows, setBackendFlows] = React.useState([]);
  const [isLoadingFlows, setIsLoadingFlows] = React.useState(false);

  // Fallback mock flows (only for temporary mock leads when backend not loaded yet)
  const fallbackMockFlows = [
    { id: 'flow1', name: 'Объявление Авито Дезинфекция', sourceType: 'Avito' },
    { id: 'flow2', name: 'Avito лидогенерация тест A', sourceType: 'Avito' },
    { id: 'flow3', name: 'Яндекс Директ услуги X', sourceType: 'Яндекс.Директ' },
    { id: 'flow4', name: 'Target промо декабрь', sourceType: 'Target' },
    { id: 'flow5', name: 'SEO органика декабрь', sourceType: 'SEO' },
    { id: 'flow6', name: 'Телефония городской номер', sourceType: 'Телефония' },
    { id: 'flow7', name: 'Лендинг сайта деза', sourceType: 'Лендинги' },
    { id: 'flow8', name: 'Avito спец акция срочные заявки', sourceType: 'Avito' },
    { id: 'flow9', name: 'Директ ретаргет Бренд', sourceType: 'Яндекс.Директ' },
    { id: 'flow10', name: 'Target аудитория Lookalike', sourceType: 'Target' },
  ];

  // Map backend thread item to our flow meta shape (preserve deletion flag)
  const mapThreadToFlow = (t) => ({
    id: String(t?.id ?? ''),
    name: t?.title || `Поток #${t?.id}`,
    sourceType: t?.traffic_source || '',
    isDeleted: Boolean(t?.is_deleted),
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingFlows(true);
      const userId = getCurrentUserId();
  const { ok, data } = await http.get(`/api/v2/threads/?user_id=${encodeURIComponent(userId)}&limit=500&include_deleted=true`);
      if (!cancelled) {
        if (ok && data && Array.isArray(data.items)) {
          setBackendFlows(data.items.map(mapThreadToFlow));
        } else {
          setBackendFlows([]);
        }
        setIsLoadingFlows(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Choose flows for mock leads: prefer backendFlows; fallback to local
  const flowsForMock = backendFlows.length > 0 ? backendFlows : fallbackMockFlows;

  // Cities options from cities.txt (full-text searchable inside MultiCitySelect)
  const cityOptions = useMemo(() => {
    const lines = (citiesRaw || '')
      .split(/\r?\n/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    // Deduplicate while preserving order
    const seen = new Set();
    const unique = [];
    for (const c of lines) { if (!seen.has(c)) { seen.add(c); unique.push(c); } }
    return unique;
  }, []);

  // Enhanced mock lead data without client names for webmaster privacy
  const mockLeads = useMemo(() => Array.from({ length: 147 }, (_, i) => {
    const flow = flowsForMock[Math.floor(Math.random() * flowsForMock.length)];
    return {
      id: i + 1,
      date: '25.12.2024',
      time: `${String(Math.floor(Math.random() * 24))?.padStart(2, '0')}:${String(Math.floor(Math.random() * 60))?.padStart(2, '0')}`,
      phone: `+7 (9${Math.floor(Math.random() * 100)?.toString()?.padStart(2, '0')}) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 90 + 10)}`,
      flowId: flow.id,
      flowName: flow.name,
      sourceType: flow.sourceType,
      status: ['confirmed', 'in_work', 'assigned', 'client_refusal', 'low_quality']?.[Math.floor(Math.random() * 5)],
      holdCommission: Math.floor(Math.random() * 5000 + 1000),
      paidCommission: Math.random() > 0.7 ? Math.floor(Math.random() * 5000 + 1000) : 0,
      city: cityOptions.length > 0
        ? cityOptions[Math.floor(Math.random() * Math.min(cityOptions.length, 200))] // limit variance for demo visuals
        : ['Москва', 'СПб', 'Екатеринбург', 'Казань', 'Новосибирск', 'Краснодар']?.[Math.floor(Math.random() * 6)]
    };
  }), [flowsForMock, cityOptions]);

  // Build and load real leads for table (do not touch charts/KPIs)
  React.useEffect(() => {
    let cancelled = false;
    const loadLeads = async () => {
      setLoadingLeads(true);
      setLeadsError(null);
      try {
        const params = new URLSearchParams();
        const userId = getCurrentUserId();
        if (userId) params.append('user_id', String(userId));
        // created_from/to in YYYY-MM-DD
        if (globalFilters?.date?.from) params.append('created_from', globalFilters.date.from);
        if (globalFilters?.date?.to) params.append('created_to', globalFilters.date.to);
        // threads (repeatable)
        (globalFilters?.flows || []).forEach((id) => { if (id) params.append('threads', id); });
        // cities (repeatable)
        (globalFilters?.cities || []).forEach((c) => { if (c) params.append('cities', c); });
        // service status (only for leads list)
        const statusToId = {
          in_work: 1,
          assigned: 2,
          confirmed: 3,
          client_refusal: 4,
          low_quality: 5,
        };
        if (statusFilter && statusFilter !== 'all') {
          const sid = statusToId[statusFilter];
          if (sid) params.append('service_status_id', String(sid));
        }
        // full-text query
        if (debouncedSearch) params.append('query', debouncedSearch);
        // pagination
        params.append('limit', String(pageSize));
        params.append('offset', String((page - 1) * pageSize));

        const url = `/api/v2/leads/?${params.toString()}`;
        const { ok, data } = await http.get(url, { navigate });
        if (cancelled) return;
        if (ok && data && Array.isArray(data.items)) {
          // Map backend items to table row shape
          const formatDate = (iso) => {
            try {
              const d = new Date(iso);
              const dd = String(d.getDate()).padStart(2, '0');
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const yyyy = d.getFullYear();
              const hh = String(d.getHours()).padStart(2, '0');
              const mi = String(d.getMinutes()).padStart(2, '0');
              return { date: `${dd}.${mm}.${yyyy}`, time: `${hh}:${mi}` };
            } catch { return { date: '', time: '' }; }
          };
          const rows = data.items.map((it) => {
            const { date, time } = formatDate(it?.created_at);
            const threadId = String(it?.thread_id ?? '');
            const threadMeta = backendFlows.find(f => String(f.id) === threadId);
            const flowName = threadMeta?.name || (it?.thread ? String(it.thread) : (threadId ? `Поток #${threadId}` : '—'));
            const sourceType = threadMeta?.sourceType || it?.source_type || '';
            const commission = typeof it?.commission === 'number' ? it.commission : 0;
            const paid = Boolean(it?.paid_commission);
            const leadType = (String(it?.source_type || '').toLowerCase() === 'call') ? 'call' : 'form';
            const statusKey = mapStatusIdToKey(it?.service_status_id);
            return {
              id: String(it?.lead_id ?? ''),
              date,
              time,
              phone: it?.client_phone ? String(it.client_phone) : '—',
              flowId: threadId,
              flowName,
              sourceType,
              status: statusKey,
              holdCommission: paid ? 0 : Math.round(commission),
              paidCommission: paid ? Math.round(commission) : 0,
              city: it?.city || 'Нет города',
              leadType,
            };
          });
          setLeads(rows);
          const total = typeof data?.pagination?.total === 'number' ? data.pagination.total : rows.length;
          setTotalLeads(total);
        } else {
          setLeads([]);
          setTotalLeads(0);
        }
      } catch (e) {
        if (!cancelled) {
          setLeads([]);
          setTotalLeads(0);
          setLeadsError('Не удалось загрузить лиды');
        }
      } finally {
        if (!cancelled) setLoadingLeads(false);
      }
    };
    loadLeads();
    return () => { cancelled = true; };
  }, [globalFilters, debouncedSearch, page, pageSize, backendFlows, navigate, statusFilter]);

  // Load lead dynamics for chart (top filters only: date, cities, flows)
  React.useEffect(() => {
    let cancelled = false;
    const loadDynamics = async () => {
      setLoadingDynamics(true);
      setDynamicsError(null);
      try {
        const params = new URLSearchParams();
        const userId = getCurrentUserId();
        if (userId) params.append('user_id', String(userId));
        const from = globalFilters?.date?.from;
        const to = globalFilters?.date?.to;
        if (from) params.append('start', `${from}T00:00:00`);
        if (to) params.append('finish', `${to}T00:00:00`);
        (globalFilters?.flows || []).forEach((id) => { if (id) params.append('threads', id); });
        (globalFilters?.cities || []).forEach((c) => { if (c) params.append('cities', c); });
        const url = `/api/v2/leads/stats/dynamics?${params.toString()}`;
        const { ok, data } = await http.get(url, { navigate });
        if (cancelled) return;
        if (ok && Array.isArray(data)) {
          setDynamicsRows(data);
        } else {
          setDynamicsRows([]);
        }
      } catch (e) {
        if (!cancelled) {
          setDynamicsRows([]);
          setDynamicsError('Не удалось загрузить динамику');
        }
      } finally {
        if (!cancelled) setLoadingDynamics(false);
      }
    };
    loadDynamics();
    return () => { cancelled = true; };
  }, [globalFilters?.date?.from, globalFilters?.date?.to, globalFilters?.cities, globalFilters?.flows, navigate]);

  // Load summary KPIs (same filters as charts, i.e., top bar filters only)
  React.useEffect(() => {
    let cancelled = false;
    const loadSummary = async () => {
      setLoadingSummary(true);
      setSummaryError(null);
      try {
        const params = new URLSearchParams();
        const userId = getCurrentUserId();
        if (userId) params.append('user_id', String(userId));
        const from = globalFilters?.date?.from;
        const to = globalFilters?.date?.to;
        if (from) params.append('created_from', from);
        if (to) params.append('created_to', to);
        (globalFilters?.flows || []).forEach((id) => { if (id) params.append('threads', id); });
        (globalFilters?.cities || []).forEach((c) => { if (c) params.append('cities', c); });
        const url = `/api/v2/leads/stats/summary?${params.toString()}`;
        const { ok, data } = await http.get(url, { navigate });
        if (cancelled) return;
        if (ok && data && typeof data === 'object') {
          setSummary(data);
        } else {
          setSummary(null);
        }
      } catch (e) {
        if (!cancelled) {
          setSummary(null);
          setSummaryError('Не удалось загрузить сводку');
        }
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    };
    loadSummary();
    return () => { cancelled = true; };
  }, [globalFilters?.date?.from, globalFilters?.date?.to, globalFilters?.cities, globalFilters?.flows, navigate]);

  // Load distribution by cities (same filters as dynamics and threads)
  React.useEffect(() => {
    let cancelled = false;
    const loadByCities = async () => {
      setLoadingCitiesStats(true);
      setCitiesStatsError(null);
      try {
        const params = new URLSearchParams();
        const userId = getCurrentUserId();
        if (userId) params.append('user_id', String(userId));
        const from = globalFilters?.date?.from;
        const to = globalFilters?.date?.to;
        if (from) params.append('created_from', from);
        if (to) params.append('created_to', to);
        (globalFilters?.flows || []).forEach((id) => { if (id) params.append('threads', id); });
        (globalFilters?.cities || []).forEach((c) => { if (c) params.append('cities', c); });
        const url = `/api/v2/leads/stats/by-cities?${params.toString()}`;
        const { ok, data } = await http.get(url, { navigate });
        if (cancelled) return;
        if (ok && Array.isArray(data)) {
          setCitiesStatsRows(data);
        } else {
          setCitiesStatsRows([]);
        }
      } catch (e) {
        if (!cancelled) {
          setCitiesStatsRows([]);
          setCitiesStatsError('Не удалось загрузить распределение по городам');
        }
      } finally {
        if (!cancelled) setLoadingCitiesStats(false);
      }
    };
    loadByCities();
    return () => { cancelled = true; };
  }, [globalFilters?.date?.from, globalFilters?.date?.to, globalFilters?.cities, globalFilters?.flows, navigate]);

  // Load distribution by threads (same filters as dynamics)
  React.useEffect(() => {
    let cancelled = false;
    const loadByThreads = async () => {
      setLoadingThreadsStats(true);
      setThreadsStatsError(null);
      try {
        const params = new URLSearchParams();
        const userId = getCurrentUserId();
        if (userId) params.append('user_id', String(userId));
        const from = globalFilters?.date?.from;
        const to = globalFilters?.date?.to;
        if (from) params.append('created_from', from);
        if (to) params.append('created_to', to);
        (globalFilters?.flows || []).forEach((id) => { if (id) params.append('threads', id); });
        (globalFilters?.cities || []).forEach((c) => { if (c) params.append('cities', c); });
        const url = `/api/v2/leads/stats/by-threads?${params.toString()}`;
        const { ok, data } = await http.get(url, { navigate });
        if (cancelled) return;
        if (ok && Array.isArray(data)) {
          setThreadsStatsRows(data);
        } else {
          setThreadsStatsRows([]);
        }
      } catch (e) {
        if (!cancelled) {
          setThreadsStatsRows([]);
          setThreadsStatsError('Не удалось загрузить распределение по потокам');
        }
      } finally {
        if (!cancelled) setLoadingThreadsStats(false);
      }
    };
    loadByThreads();
    return () => { cancelled = true; };
  }, [globalFilters?.date?.from, globalFilters?.date?.to, globalFilters?.cities, globalFilters?.flows, navigate]);

  // Lead dynamics data for chart (mapped from server response)
  const leadDynamicsData = useMemo(() => {
    const sameDay = globalFilters?.date?.from && globalFilters?.date?.to && globalFilters.date.from === globalFilters.date.to;
    const fmt = (iso) => {
      try {
        const d = new Date(iso);
        if (sameDay) {
          const hh = String(d.getHours()).padStart(2, '0');
          return `${hh}:00`;
        }
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${dd}.${mm}`;
      } catch {
        return '';
      }
    };
    return (dynamicsRows || []).map(r => ({
      date: fmt(r?.bucket),
      leads: typeof r?.total === 'number' ? r.total : 0,
      confirmed: typeof r?.realized === 'number' ? r.realized : 0,
    }));
  }, [dynamicsRows, globalFilters?.date?.from, globalFilters?.date?.to]);

  // Build distribution by flows (top N flows + Остальные) from backend stats
  const flowsDistribution = useMemo(() => {
    const rows = (threadsStatsRows || []).map(r => {
      const id = String(r?.thread_id ?? '');
      const meta = backendFlows.find(f => String(f.id) === id);
      return {
        id,
        name: meta?.name || (id ? `Поток #${id}` : '—'),
        sourceType: meta?.sourceType || '',
        value: typeof r?.total === 'number' ? r.total : 0,
      };
    }).filter(r => r.value > 0)
      .sort((a,b) => b.value - a.value);
    const palette = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#f97316','#6366f1','#0ea5e9','#14b8a6'];
    const top = rows.slice(0,6).map((r,i) => ({ ...r, color: palette[i % palette.length] }));
    const restValue = rows.slice(6).reduce((s,r)=>s+r.value,0);
    if(restValue > 0) top.push({ id: 'other', name: 'Остальные', sourceType: '', value: restValue, color: '#d1d5db' });
    return top;
  }, [threadsStatsRows, backendFlows]);

  // Distribution by cities (top 6)
  const sortedCityDistribution = useMemo(() => {
    const rows = (citiesStatsRows || []).map(r => ({
      name: r?.city || 'Нет города',
      value: typeof r?.total === 'number' ? r.total : 0,
    }))
    .filter(r => r.value > 0)
    .sort((a,b) => b.value - a.value);
    return rows.slice(0, 6);
  }, [citiesStatsRows]);

  // Icon mapping for sources
  const sourceIcon = (name) => {
    const s = String(name || '').toLowerCase().trim();
    if (!s) return 'Circle';
    // Avito (support Cyrillic and Latin)
    if (s.includes('авито') || s.includes('avito')) return 'AvitoLogo';
    // Yandex Direct (both with/without dot)
    if (s.includes('яндекс') && s.includes('дир')) return 'Search';
    // 2GIS maps
    if (s.includes('2gis') || s.includes('2 gis') || s.includes('карты')) return 'Map';
    // Marketplaces (Профи.ру, Яндекс Услуги, др.)
    if (s.includes('профи') || s.includes('яндекс услуги') || s.includes('услуги') || s.includes('маркетплейс')) return 'Store';
    // Targeting ads (Cyrillic/Latin)
    if (s.includes('таргет') || s.includes('target')) return 'Target';
    // SEO
    if (s.includes('seo')) return 'TrendingUp';
    // Telephony
    if (s.includes('телефон') || s.includes('телефония')) return 'Phone';
    // Landing pages
    if (s.includes('лендинг')) return 'Globe';
    // VK ads
    if (s.includes('vk') || s.includes('вк')) return 'Users';
    // API
    if (s === 'api') return 'Webhook';
    return 'Circle';
  };

  // Map lead type to icon
  const leadTypeIcon = (type) => {
    const t = String(type || '').toLowerCase();
    if (t === 'call') return 'Phone';
    return 'FileText'; // 'form' or default
  };

  // Custom tooltip for lead dynamics
  const LeadDynamicsTooltip = ({ active, payload, label }) => {
    if(!active || !payload || payload.length === 0) return null;
    const leadsRow = payload.find(p => p.dataKey === 'leads');
    const confirmedRow = payload.find(p => p.dataKey === 'confirmed');
    return (
      <div className="bg-white border border-yellow-300 rounded-md shadow-sm p-2 min-w-[140px]">
        <div className="text-[10px] text-gray-400 text-right mb-1 font-mono">{label}</div>
        <div className="flex items-center justify-between text-[11px] mb-0.5">
          <span className="text-gray-500">Всего</span>
          <span className="font-mono font-semibold text-gray-800">{leadsRow?.value}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-500">Подтверждено</span>
          <span className="font-mono font-semibold text-green-600">{confirmedRow?.value}</span>
        </div>
      </div>
    );
  };

  const SourceTooltip = ({ active, payload }) => {
    if(!active || !payload || payload.length === 0) return null;
    const p = payload[0];
    const percent = p && p.percent ? (p.percent * 100).toFixed(1) : null;
    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-sm p-2 text-[11px]">
        <div className="flex items-start mb-1">
          <span className="w-2 h-2 rounded-full mr-2 mt-1" style={{ background:p.payload.color }}></span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-gray-700 truncate" title={p?.name}>{p?.name}</div>
            {p?.payload?.sourceType && (
              <div className="flex items-center text-[10px] text-gray-400 mt-0.5">
                <Icon name={sourceIcon(p?.payload?.sourceType)} size={10} className="mr-1 opacity-60" />
                <span className="truncate">{p?.payload?.sourceType}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between"><span className="text-gray-500">Лидов</span><span className="font-mono font-semibold text-gray-800">{p?.value}</span></div>
        {percent && <div className="flex justify-between"><span className="text-gray-500">Доля</span><span className="font-mono text-gray-700">{percent}%</span></div>}
      </div>
    );
  };

  const CityTooltip = ({ active, payload, label }) => {
    if(!active || !payload || payload.length === 0) return null;
    const p = payload[0];
    return (
      <div className="bg-white border border-yellow-300 rounded-md shadow-sm p-2 text-[11px]">
        <div className="text-[10px] text-gray-400 mb-1 font-mono">{label}</div>
        <div className="flex justify-between"><span className="text-gray-500">Лидов</span><span className="font-mono font-semibold text-gray-800">{p?.value}</span></div>
      </div>
    );
  };

  // flowsUniverse for FlowsPicker comes from backend threads
  // For picker UI, show only active (not deleted) flows; keep full list in backendFlows for id->meta mappings
  const flowsUniverse = useMemo(() => backendFlows
    .filter(f => !f.isDeleted)
    .map(f => ({
      id: f.id,
      name: f.name,
      sourceType: f.sourceType,
      icon: sourceIcon(f.sourceType),
    })), [backendFlows]);

  const filteredLeads = useMemo(() => mockLeads.filter(lead => {
    if (debouncedSearch && !lead.phone.includes(debouncedSearch)) return false;
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (globalFilters.cities.length > 0 && !globalFilters.cities.includes(lead.city)) return false;
    if (globalFilters.flows.length > 0 && !globalFilters.flows.includes(lead.flowId)) return false;
    return true;
  }), [mockLeads, debouncedSearch, statusFilter, globalFilters]);

  // Reset page when filters or search change
  React.useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, globalFilters]);

  // Table pagination is based on backend total
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalLeads / pageSize)), [totalLeads, pageSize]);
  const paginatedLeads = leads; // backend already paginates by limit/offset

  const rangeLabel = useMemo(() => {
    if(totalLeads === 0) return '0';
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(totalLeads, page * pageSize);
    return `${start}-${end}`;
  }, [totalLeads, page, pageSize]);

  const PaginationControls = ({ position }) => {
    if (totalLeads === 0) return null;
    return (
      <div className={`flex flex-wrap items-center gap-2 ${position === 'top' ? 'mb-2' : 'mt-3'} text-[11px]`}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`h-7 px-3 rounded-lg border nav-transition ${page === 1 ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-gray-300 hover:border-yellow-400 hover:text-yellow-600 text-gray-600'}`}
          >Назад</button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`h-7 px-3 rounded-lg border nav-transition ${page === totalPages ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-gray-300 hover:border-yellow-400 hover:text-yellow-600 text-gray-600'}`}
          >Вперёд</button>
          <div className="ml-2 text-gray-500">Стр. <span className="font-mono text-gray-800">{page}</span> / {totalPages}</div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="h-7 text-[11px] border border-gray-300 rounded-lg px-3 pr-7 focus:border-yellow-400 focus:outline-none bg-white min-w-[110px] flex items-center leading-none"
          >
            {[20,30,50,100].map(size => <option key={size} value={size}>{size} / стр</option>)}
          </select>
          <div className="text-gray-500 whitespace-nowrap">Показано {rangeLabel} из {totalLeads}</div>
        </div>
      </div>
    );
  };

  // KPIs derived from backend summary (fallbacks to zeros)
  const stats = useMemo(() => {
    const total = Number(summary?.total ?? 0);
    const confirmed = Number(summary?.confirmed_count ?? 0);
    return {
      total,
      confirmed,
      inWork: Number(summary?.hold_count ?? 0),
      lowQuality: Number(summary?.bad_count ?? 0),
      totalHoldCommission: Math.round(Number(summary?.commission_hold_sum ?? 0)),
      totalPaidCommission: Math.round(Number(summary?.paid_sum ?? 0)),
      conversionRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  }, [summary]);

  // removed handleFilterChange (legacy)

  const getStatusBadge = (status) => {
    const config = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Подтвержден', dot: 'bg-green-500' },
      in_work: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'В работе', dot: 'bg-blue-500' },
      assigned: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Назначено', dot: 'bg-yellow-500' },
      client_refusal: { bg: 'bg-red-100', text: 'text-red-700', label: 'Отказ клиента', dot: 'bg-red-500' },
      low_quality: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Некачественный', dot: 'bg-gray-500' }
    }?.[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Новый', dot: 'bg-gray-500' };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium ${config?.bg} ${config?.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${config?.dot}`} />
        <span className="truncate max-w-[140px]">{config?.label}</span>
      </span>
    );
  };

  const formatCurrency = (amount) => `${amount.toLocaleString('ru-RU')}₽`;

  // Map backend service_status_id -> UI status key
  const mapStatusIdToKey = (id) => {
    const n = Number(id);
    switch (n) {
      case 1: return 'in_work';
      case 2: return 'assigned';
      case 3: return 'confirmed';
      case 4: return 'client_refusal';
      case 5: return 'low_quality';
      default: return 'in_work';
    }
  };

  // Enhanced yellow decorative figures component with more figures for top area
  const YellowFigures = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Original figures */}
      <div className="absolute top-20 right-10 w-8 h-8 bg-yellow-200 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
      <div className="absolute top-40 right-32 w-6 h-6 bg-yellow-300 transform rotate-45 opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-32 right-16 w-10 h-4 bg-yellow-400 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
      <div className="absolute top-1/3 right-4 w-3 h-8 bg-yellow-300 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/4 right-24 w-5 h-5 bg-yellow-400 opacity-15 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '5s' }}></div>
      
      {/* Additional figures for better coverage of top area */}
      <div className="absolute top-12 right-20 w-7 h-7 bg-yellow-200 rounded-full opacity-15 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '4s' }}></div>
      <div className="absolute top-28 right-48 w-4 h-4 bg-yellow-300 transform rotate-12 opacity-20 animate-pulse" style={{ animationDelay: '1.3s' }}></div>
      <div className="absolute top-16 right-64 w-9 h-3 bg-yellow-400 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '2.3s', animationDuration: '3.5s' }}></div>
      <div className="absolute top-52 right-8 w-2 h-6 bg-yellow-300 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '0.8s' }}></div>
      <div className="absolute top-8 right-80 w-6 h-6 bg-yellow-400 opacity-20 animate-bounce" style={{ animationDelay: '1.8s', animationDuration: '4.5s' }}></div>
      <div className="absolute top-36 right-56 w-5 h-10 bg-yellow-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2.8s' }}></div>

      {/* Left side ambient figures (new) */}
      <div className="absolute top-24 left-6 w-9 h-9 bg-yellow-200 rounded-full opacity-15 animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '3.5s' }}></div>
      <div className="absolute top-48 left-20 w-7 h-7 bg-yellow-300 transform rotate-12 opacity-20 animate-pulse" style={{ animationDelay: '1.4s' }}></div>
      <div className="absolute top-14 left-40 w-14 h-6 bg-yellow-400 rounded-full opacity-10 animate-bounce" style={{ animationDelay: '2.2s', animationDuration: '4.5s' }}></div>
      <div className="absolute top-64 left-10 w-3 h-12 bg-yellow-300 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '0.9s' }}></div>
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
      <main className={`nav-transition relative z-10 ${sidebarCollapsed ? 'lg:ml-sidebar-collapsed' : 'lg:ml-sidebar-width'}`}>
  <div className="p-4 max-w-7xl mx-auto">
          {/* Global compact filter bar */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <DateRangeCompact 
              value={globalFilters.date} 
              onChange={(date) => setGlobalFilters(f => ({ ...f, date }))} 
            />
            <MultiCitySelect 
              value={globalFilters.cities} 
              onChange={(cities) => setGlobalFilters(f => ({ ...f, cities }))}
              options={cityOptions}
            />
            <FlowsPicker 
              value={globalFilters.flows}
              onChange={(flows) => setGlobalFilters(f => ({ ...f, flows }))}
              flows={flowsUniverse}
            />
            {(() => {
              const last30 = (() => {
                const today = new Date();
                const to = today;
                const from = new Date(today); from.setDate(today.getDate() - 29);
                const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                return { from: fmt(from), to: fmt(to), preset: 'month' };
              })();
              const isDefault = globalFilters.cities.length === 0 && globalFilters.flows.length === 0 && globalFilters.date.from === last30.from && globalFilters.date.to === last30.to && globalFilters.date.preset === 'month';
              return !isDefault;
            })() && (
              <button
                onClick={() => setGlobalFilters({ date: computeLast30(), cities: [], flows: [] })}
                className="h-[30px] px-3 text-[11px] rounded-lg border border-gray-300 hover:border-red-400 hover:text-red-600 nav-transition text-gray-600"
              >Сброс</button>
            )}
            <div className="text-[11px] text-gray-400 ml-auto pr-1">Авто-применение</div>
          </div>
          {(globalFilters.cities.length > 0 || globalFilters.flows.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {globalFilters.cities.map(city => (
                <button
                  key={city}
                  onClick={() => setGlobalFilters(f => ({ ...f, cities: f.cities.filter(c => c !== city) }))}
                  className="group flex items-center h-6 pl-2 pr-1 rounded-md bg-gray-100 text-[11px] text-gray-700 hover:bg-yellow-400 hover:text-white nav-transition"
                >
                  <span>{city}</span>
                  <span className="ml-1 px-1 rounded text-gray-400 group-hover:text-white">×</span>
                </button>
              ))}
              {globalFilters.flows.map(flowId => {
                const meta = flowsUniverse.find(f => f.id === flowId);
                const label = meta ? meta.name : flowId;
                return (
                  <button
                    key={flowId}
                    onClick={() => setGlobalFilters(f => ({ ...f, flows: f.flows.filter(fl => fl !== flowId) }))}
                    className="group flex items-center h-6 pl-2 pr-1 rounded-md bg-gray-100 text-[11px] text-gray-700 hover:bg-yellow-400 hover:text-white nav-transition max-w-[180px]"
                    title={label}
                  >
                    <span className="truncate max-w-[140px]">{label}</span>
                    <span className="ml-1 px-1 rounded text-gray-400 group-hover:text-white">×</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Secondary (status) filters will move just above table - removed from here */}

          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Icon name="Users" size={16} color="#3B82F6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Всего</p>
                  <p className="text-lg font-bold text-gray-900">{stats?.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                  <Icon name="Clock" size={16} color="#F59E0B" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">В холде</p>
                  <p className="text-lg font-bold text-yellow-600">{stats?.inWork}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg mr-3">
                  <Icon name="XCircle" size={16} color="#6B7280" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Некачественных</p>
                  <p className="text-lg font-bold text-gray-600">{stats?.lowQuality}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <Icon name="CheckCircle" size={16} color="#10B981" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Подтв.</p>
                  <p className="text-lg font-bold text-green-600">{stats?.confirmed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <Icon name="DollarSign" size={16} color="#F97316" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Комиссия в холде</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(stats?.totalHoldCommission)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <Icon name="TrendingUp" size={16} color="#8B5CF6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Комиссия</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(stats?.totalPaidCommission)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Analytics with Distribution Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
            {/* Lead Dynamics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">Динамика лидов</h3>
                <span className="text-[11px] text-gray-400">фильтры применены</span>
              </div>
              {/* Unified chart wrapper with controlled gutters */}
              <div className="relative -mx-2 px-2">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={leadDynamicsData} margin={{ top: 12, right: 20, left: 8, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12 }} width={34} />
                  <Tooltip content={<LeadDynamicsTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confirmed" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  />
                  </LineChart>
                </ResponsiveContainer>
                {loadingDynamics && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Icon name="Loader2" className="animate-spin text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Distribution by Sources */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">Потоки <span className="inline-block uppercase tracking-wide text-[9px] font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-2 py-[2px] rounded-full shadow-sm border border-yellow-300">топ</span></h3>
              </div>
              <div className="relative -mx-2 px-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 6 }}>
                    <Pie data={flowsDistribution} cx="50%" cy="50%" innerRadius={36} outerRadius={86} dataKey="value" paddingAngle={1}>
                    {flowsDistribution?.map((entry, index) => (
                      <Cell key={`flow-${index}`} fill={entry?.color} />
                    ))}
                    </Pie>
                    <Tooltip content={<SourceTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {flowsDistribution.map(src => (
                  <div key={src.id} className="flex items-center text-[11px] truncate">
                    <span className="w-2 h-2 rounded-full mr-2" style={{ background: src.color }}></span>
                    <span className="text-gray-700 truncate" title={src.name}>{src.name}</span>
                    <span className="ml-auto font-mono text-gray-600">{src.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution by Cities */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">Города <span className="inline-block uppercase tracking-wide text-[9px] font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-2 py-[2px] rounded-full shadow-sm border border-yellow-300">топ</span></h3>
              </div>
              <div className="relative -mx-2 px-2">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sortedCityDistribution} margin={{ top: 12, right: 20, left: 8, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} width={34} />
                  <Tooltip content={<CityTooltip />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
                {loadingCitiesStats && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Icon name="Loader2" className="animate-spin text-gray-300" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Local status + search bar now directly above table */}
          <div className="flex flex-wrap items-center gap-2 mb-2 mt-4">
            <StatusToggle value={statusFilter} onChange={setStatusFilter} />
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="h-[30px] w-[180px] pl-7 pr-2 border border-gray-300 rounded-lg text-[12px] focus:border-yellow-400 focus:outline-none"
              />
            </div>
            <div className="text-[11px] text-gray-500 ml-auto">{leads.length} / {totalLeads}</div>
            <div className="text-[11px] text-gray-400">Конв. {stats.conversionRate}%</div>
          </div>

          {/* Pagination (Top) */}
          <PaginationControls position="top" />

          {/* Dense Table Header */}
          <div className="px-2 mb-1">
            <div className="flex items-center text-[10px] font-semibold text-gray-500 uppercase tracking-wide select-none">
              <span className="w-12 flex-shrink-0 mr-6">ID</span>
              <span className="w-28 flex-shrink-0">Дата / Время</span>
              <span className="w-28 flex-shrink-0 pl-1">Комиссия</span>
              <span className="w-20 flex-shrink-0">Город</span>
              <span className="w-40 flex-shrink-0">Статус</span>
              <span className="w-40 flex-shrink-0">Поток</span>
              <span className="w-16 flex-shrink-0">Тип</span>
              <span className="flex-1 min-w-0">Телефон</span>
            </div>
          </div>

          {/* Dense Lead List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
                {paginatedLeads?.map((lead) => (
                <div 
                  key={lead?.id}
                  className="px-2 py-2 hover:bg-yellow-50/70 transition-colors text-[12px]"
                >
                  <div className="flex items-center">
                    <span className="text-[11px] text-gray-400 w-12 flex-shrink-0 font-mono mr-6">#{lead?.id}</span>
                    <span className="text-[11px] text-gray-500 w-28 flex-shrink-0 font-mono">{lead?.date} {lead?.time}</span>
                    <span className={`text-[12px] font-semibold w-28 flex-shrink-0 pl-3 font-mono ${lead?.paidCommission > 0 ? 'text-green-600' : 'text-orange-600'}`}>{lead?.paidCommission > 0 ? formatCurrency(lead?.paidCommission) : formatCurrency(lead?.holdCommission)}</span>
                    <span className="text-[11px] text-gray-600 w-20 flex-shrink-0">{lead?.city}</span>
                    <div className="w-40 flex-shrink-0">{getStatusBadge(lead?.status)}</div>
                    <div className="w-40 flex-shrink-0 pr-2">
                      <div className="text-[11px] font-medium text-gray-700 truncate" title={lead?.flowName}>{lead?.flowName}</div>
                      <div className="flex items-center text-[10px] text-gray-400 mt-0.5">
                        <Icon name={sourceIcon(lead?.sourceType)} size={10} className="mr-1 opacity-60" />
                        <span className="truncate">{lead?.sourceType}</span>
                      </div>
                    </div>
                    <div className="w-16 flex-shrink-0 flex items-center text-gray-600">
                      <Icon name={leadTypeIcon(lead?.leadType)} size={14} className="opacity-80" />
                    </div>
                    <span className="text-[11px] text-gray-600 flex-1 min-w-0 truncate ml-2 font-mono">{lead?.phone}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {totalLeads === 0 && (
              <div className="text-center py-12 text-gray-500 text-[13px]">Нет данных по текущим фильтрам</div>
            )}
          </div>
          {/* Pagination (Bottom) */}
          <PaginationControls position="bottom" />
        </div>
      </main>
    </div>
  );
}