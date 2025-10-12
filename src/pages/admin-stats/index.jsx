import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Icon from 'components/AppIcon';
import DateRangeCompact from 'components/filters/DateRangeCompact';
import http from 'services/http';
import { getCurrentUserId } from 'utils/auth';
import citiesRaw from 'pages/leads/cities.txt?raw';

// Admin Statistics Page (Initial Scaffold)
// Columns: ID, Created At, Webmaster (Name + ID), Commission, City, Status, Flow, Phone, Client Name, Paid Flag, Paid Date, Offer
// Commission states: hold (orange), realized unpaid (green + unpaid icon off), realized paid (green + paid icon), burned (gray + strikethrough or blank)

const generateMock = () => {
    const webmasters = Array.from({ length: 8 }, (_, i) => ({
        id: `W${1000 + i}`,
        name: `Вебмастер ${i + 1}`
    }));
    const sourceTypes = ['Avito', 'Яндекс.Директ', 'Target', 'SEO', 'Телефония', 'Лендинги'];
    const flows = Array.from({ length: 20 }, (_, i) => ({
        id: `F${2000 + i}`,
        name: `Поток тестовый ${i + 1}`,
        wmId: webmasters[Math.floor(Math.random() * webmasters.length)].id,
        sourceType: sourceTypes[i % sourceTypes.length]
    }));
    const cities = ['Москва', 'СПб', 'Екатеринбург', 'Казань', 'Новосибирск', 'Краснодар'];
    const statuses = ['confirmed', 'in_work', 'assigned', 'client_refusal', 'low_quality'];
    const offers = ['Дезинфекция'];

    const leads = Array.from({ length: 240 }, (_, i) => {
        const flow = flows[Math.floor(Math.random() * flows.length)];
        const wm = webmasters.find(w => w.id === flow.wmId) || webmasters[0];
        const id = String(40000000 + i).padStart(8, '0');
        const created = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 29);
        const commissionBase = Math.floor(Math.random() * 5000 + 500);
        const realized = Math.random() > 0.35; // realized vs hold
        const paidFlag = realized && Math.random() > 0.6; // subset of realized
        const burned = !realized && Math.random() > 0.85; // rare burned flag (would correlate with low_quality later)
        return {
            id,
            created,
            wmId: wm.id,
            wmName: wm.name,
            flowId: flow.id,
            flowName: flow.name,
            sourceType: flow.sourceType,
            commission: commissionBase,
            realized,
            paidFlag,
            paidDate: paidFlag ? new Date(created.getTime() + Math.random() * 1000 * 60 * 60 * 24 * 7) : null,
            burned,
            city: cities[Math.floor(Math.random() * cities.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            phone: `+7 (9${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 90 + 10)}`,
            clientName: `Клиент ${i + 1}`,
            offer: offers[0]
        };
    });
    return { webmasters, flows, leads, offers };
};

// Map backend traffic source to UI label expected by icons
const mapTrafficSourceLabel = (src) => {
    if (!src) return 'Лендинги';
    const s = String(src).toLowerCase();
    if (s.includes('avito') || s.includes('авито')) return 'Avito';
    if (s.includes('янд') || s.includes('директ')) return 'Яндекс.Директ';
    if (s.includes('target') || s.includes('таргет')) return 'Target';
    if (s === 'seo' || s.includes('сео')) return 'SEO';
    if (s.includes('2gis') || s.includes('2 gis') || s.includes('карты')) return 'Карты 2GIS';
    if (s.includes('телефон')) return 'Телефония';
    if (s.includes('ленд') || s.includes('лендинг')) return 'Лендинги';
    return src; // fallback to whatever backend sends
};

const mapThreadToFlow = (item) => ({
    id: String(item?.id ?? ''),
    name: item?.title || `Поток ${item?.id}`,
    sourceType: mapTrafficSourceLabel(item?.traffic_source)
});

const AdminStatsPage = () => {
    const { webmasters: mockWebmasters, flows: mockFlows, leads: initialLeads, offers: mockOffers } = useMemo(() => generateMock(), []);
    // Backend-provided options
    const [allCities, setAllCities] = useState([]);
    const [backendFlows, setBackendFlows] = useState([]);
    const [isLoadingFlows, setIsLoadingFlows] = useState(false);
    const [backendWebmasters, setBackendWebmasters] = useState([]);
    const [isLoadingWebmasters, setIsLoadingWebmasters] = useState(false);
    const [backendOffers, setBackendOffers] = useState([]); // [{offer_id, title}]
    const [isLoadingOffers, setIsLoadingOffers] = useState(false);
    const [leads, setLeads] = useState(initialLeads); // mock used only for charts for now
    // Table (backend) leads state
    const [tableItems, setTableItems] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableError, setTableError] = useState('');
    const [tableTotal, setTableTotal] = useState(0);
    // Temporary role guard (to be replaced with real auth context)
    const userRole = 'admin';
    const [dateFilter, setDateFilter] = useState({ from: '', to: '', preset: 'month' });
    const [citiesFilter, setCitiesFilter] = useState([]); // city strings
    const [flowsFilter, setFlowsFilter] = useState([]); // flow ids
    const [wmFilter, setWmFilter] = useState([]); // webmaster ids
    const [offerFilter, setOfferFilter] = useState([]); // store selected offer_id as string in [0] or empty for all
    const [statusFilter, setStatusFilter] = useState('all');
    const [paidFilter, setPaidFilter] = useState('all'); // all|paid|unpaid
    const [phoneQuery, setPhoneQuery] = useState('');
    const [flowSearch, setFlowSearch] = useState('');
    const [wmSearch, setWmSearch] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const [openDropdown, setOpenDropdown] = useState(null); // 'flows' | 'webmasters' | 'cities' | null
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load cities from cities.txt (over 1k items)
    useEffect(() => {
        const rows = String(citiesRaw || '')
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(Boolean);
        setAllCities(rows);
    }, []);

    // Load flows from backend (limit 500)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoadingFlows(true);
            const userId = getCurrentUserId(); // reserved if backend needs scoping later
            const { ok, data } = await http.get(`/api/v2/threads/?limit=500`);
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

    // Load webmasters
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoadingWebmasters(true);
            const { ok, data } = await http.get(`/api/v2/users/?role=webmaster`);
            if (!cancelled) {
                if (ok && data && Array.isArray(data.items)) {
                    setBackendWebmasters(
                        data.items.map((it) => ({ id: String(it.id), name: it.full_name || it.login || `Вебмастер ${it.id}` }))
                    );
                } else {
                    setBackendWebmasters([]);
                }
                setIsLoadingWebmasters(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Load offers
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoadingOffers(true);
            const { ok, data } = await http.get(`/api/v2/offers/`);
            if (!cancelled) {
                if (ok && data && Array.isArray(data.items)) {
                    setBackendOffers(data.items.map((o) => ({ offer_id: o.offer_id, title: o.title })).filter(o => o.title));
                } else {
                    setBackendOffers([]);
                }
                setIsLoadingOffers(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [selected, setSelected] = useState(new Set());
    // Persist minimal info for selected leads across pagination pages
    const [selectedMeta, setSelectedMeta] = useState(new Map());
    const [sort, setSort] = useState({ field: 'created', dir: 'desc' });
    const [showPayConfirm, setShowPayConfirm] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [payError, setPayError] = useState('');
    const [copiedId, setCopiedId] = useState('');
    // Select-all filtered mode and summary
    const [selectAllFiltered, setSelectAllFiltered] = useState(false);
    const [filterSummary, setFilterSummary] = useState(null); // { realized_unpaid: {count,sum}, realized_paid: {count,sum}, hold: {count,sum} }
    const [loadingFilterSummary, setLoadingFilterSummary] = useState(false);
    const [filterSummaryError, setFilterSummaryError] = useState('');
    // Lead dynamics (backend)
    const [leadDynamicsData, setLeadDynamicsData] = useState([]);
    const [loadingDynamics, setLoadingDynamics] = useState(false);
    const [dynamicsError, setDynamicsError] = useState('');
    // Commission breakdown (backend)
    const [commissionStatsData, setCommissionStatsData] = useState([]);
    const [loadingCommission, setLoadingCommission] = useState(false);
    const [commissionError, setCommissionError] = useState('');
    // Cities distribution (backend)
    const [citiesStatsData, setCitiesStatsData] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [citiesError, setCitiesError] = useState('');
    const citiesChartRef = useRef(null);
    const [maxCitiesToShow, setMaxCitiesToShow] = useState(10);
    // trigger refetches after mutations (e.g., payments)
    const [refreshNonce, setRefreshNonce] = useState(0);

    const formatDateTime = (d) => {
        if (!d) return '';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
    };

    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            if (dateFilter.from) { const fromD = new Date(dateFilter.from); if (l.created < fromD) return false; }
            if (dateFilter.to) { const toD = new Date(dateFilter.to + 'T23:59:59'); if (l.created > toD) return false; }
            if (citiesFilter.length && !citiesFilter.includes(l.city)) return false;
            if (flowsFilter.length && !flowsFilter.includes(l.flowId)) return false;
            if (wmFilter.length && !wmFilter.includes(l.wmId)) return false;
            if (offerFilter.length && !offerFilter.includes(l.offer)) return false;
            if (statusFilter !== 'all' && l.status !== statusFilter) return false;
            if (paidFilter === 'paid' && !l.paidFlag) return false;
            if (paidFilter === 'unpaid' && l.paidFlag) return false;
            return true;
        });
    }, [leads, dateFilter, citiesFilter, flowsFilter, wmFilter, offerFilter, statusFilter, paidFilter]);

    const sortedLeads = useMemo(() => {
        const arr = [...filteredLeads];
        arr.sort((a, b) => {
            if (sort.field === 'created') return sort.dir === 'asc' ? a.created - b.created : b.created - a.created;
            if (sort.field === 'commission') return sort.dir === 'asc' ? a.commission - b.commission : b.commission - a.commission;
            return 0;
        });
        return arr;
    }, [filteredLeads, sort]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedLeads.slice(start, start + pageSize);
    }, [sortedLeads, page, pageSize]);

    // Advanced pagination helpers
    // Backend table pagination helpers (charts still use mock-derived data)
    const totalPages = useMemo(() => Math.max(1, Math.ceil((tableTotal || 0) / pageSize)), [tableTotal, pageSize]);
    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
    const rangeLabel = useMemo(() => {
        if ((tableTotal || 0) === 0) return '0';
        const start = (page - 1) * pageSize + 1; const end = Math.min(tableTotal, start - 1 + (tableItems?.length || 0));
        return `${start}-${end}`;
    }, [tableTotal, page, pageSize, tableItems.length]);
    const buildPages = () => {
        const pages = [];
        const maxButtons = 7;
        if (totalPages <= maxButtons) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }
        const showLeft = page > 3;
        const showRight = page < totalPages - 2;
        pages.push(1);
        if (showLeft) pages.push('left-ellipsis');
        const start = Math.max(2, page - 1);
        const end = Math.min(totalPages - 1, page + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (showRight) pages.push('right-ellipsis');
        pages.push(totalPages);
        return pages;
    };
    const pageItems = buildPages();

    // Lookups for mapping
    const flowsById = useMemo(() => {
        const map = new Map();
        (backendFlows.length ? backendFlows : mockFlows).forEach(f => map.set(String(f.id), f));
        return map;
    }, [backendFlows, mockFlows]);
    const webmastersById = useMemo(() => {
        const map = new Map();
        (backendWebmasters.length ? backendWebmasters : mockWebmasters).forEach(w => map.set(String(w.id), w));
        return map;
    }, [backendWebmasters, mockWebmasters]);
    const offerMap = useMemo(() => {
        const map = new Map();
        backendOffers.forEach(o => map.set(String(o.offer_id), o.title));
        // also include mock if needed
        if (backendOffers.length === 0 && mockOffers?.length) {
            // mock has only titles, no ids — skip mapping
        }
        return map;
    }, [backendOffers, mockOffers]);

    const statusIdToKey = (id) => {
        const n = typeof id === 'string' ? parseInt(id, 10) : id;
        switch (n) {
            case 3: return 'confirmed';
            case 1: return 'in_work';
            case 2: return 'assigned';
            case 4: return 'client_refusal';
            case 5: return 'low_quality';
            default: return 'in_work';
        }
    };
    const statusKeyToId = (key) => ({ in_work: 1, assigned: 2, confirmed: 3, client_refusal: 4, low_quality: 5 })[key];

    // Resolve offer select value safely (id or none)
    const selectedOfferValue = useMemo(() => {
        const raw = offerFilter?.[0];
        if (!raw) return '';
        // If already an id
        if (/^\d+$/.test(String(raw))) return String(raw);
        // Else find by title
        const found = backendOffers.find(o => o.title === raw);
        return found ? String(found.offer_id) : '';
    }, [offerFilter, backendOffers]);

    // Fetch backend leads for table only
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setTableLoading(true); setTableError('');
            try {
                const params = new URLSearchParams();
                if (flowsFilter.length) params.set('threads', flowsFilter.join(','));
                if (statusFilter !== 'all') params.set('service_status_id', String(statusKeyToId(statusFilter)));
                if (citiesFilter.length) params.set('cities', citiesFilter.join(','));
                if (dateFilter.from) params.set('created_from', dateFilter.from);
                if (dateFilter.to) params.set('created_to', dateFilter.to);
                if (pageSize) params.set('limit', String(pageSize));
                const offset = (page - 1) * pageSize; params.set('offset', String(offset));
                if (phoneQuery && phoneQuery.trim()) params.set('query', phoneQuery.trim());
                if (wmFilter.length) params.set('users', wmFilter.join(','));
                if (paidFilter !== 'all') params.set('paid_commission', paidFilter === 'paid' ? 'true' : 'false');
                if (selectedOfferValue) params.set('offer_id', selectedOfferValue);

                const path = `/api/v2/leads/?${params.toString()}`;
                const { ok, data } = await http.get(path);
                if (cancelled) return;
                if (ok && data && Array.isArray(data.items)) {
                    const mapped = data.items.map((it) => {
                        const created = it.created_at ? new Date(it.created_at) : null;
                        const flow = flowsById.get(String(it.thread_id));
                        const wm = webmastersById.get(String(it.user_id));
                        const statusKey = statusIdToKey(it.service_status_id);
                        const burned = statusKey === 'client_refusal' || statusKey === 'low_quality';
                        return {
                            id: String(it.lead_id),
                            created,
                            wmId: String(it.user_id || ''),
                            wmName: wm?.name || String(it.user_id || ''),
                            flowId: String(it.thread_id || ''),
                            flowName: flow?.name || String(it.thread || it.thread_id || ''),
                            sourceType: flow?.sourceType || 'Лендинги',
                            commission: Number(it.commission || 0),
                            realized: statusKey === 'confirmed',
                            paidFlag: Boolean(it.paid_commission),
                            paidDate: it.paid_commission_date ? new Date(it.paid_commission_date) : null,
                            burned,
                            city: it.city || '—',
                            status: statusKey,
                            phone: it.client_phone || '',
                            clientName: it.client_name || '',
                            offer: offerMap.get(String(it.offer_id)) || (mockOffers?.[0] || '')
                        };
                    });
                    setTableItems(mapped);
                    const total = Number(data.pagination?.total || mapped.length);
                    setTableTotal(total);
                } else {
                    setTableItems([]);
                    setTableTotal(0);
                }
            } catch (e) {
                if (!cancelled) { setTableError('Не удалось загрузить лиды'); setTableItems([]); setTableTotal(0); }
            } finally {
                if (!cancelled) setTableLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [flowsFilter, statusFilter, citiesFilter, dateFilter.from, dateFilter.to, page, pageSize, phoneQuery, wmFilter, paidFilter, selectedOfferValue, http, flowsById, webmastersById, offerMap, mockOffers, refreshNonce]);

    // Fetch lead dynamics for chart (backend)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingDynamics(true); setDynamicsError('');
            try {
                const params = new URLSearchParams();
                // Period mapping: start/finish. If equal day -> hourly granularity per backend.
                const pad = (n) => String(n).padStart(2, '0');
                const toLocalStart = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
                const makeDateAt = (dateStr, h = 0, m = 0) => {
                    const d = new Date(dateStr + 'T00:00:00');
                    d.setHours(h, m, 0, 0);
                    return d;
                };
                let startStr = '', finishStr = '';
                if (dateFilter.from && dateFilter.to) {
                    const fromD = makeDateAt(dateFilter.from, 0, 0);
                    const toD = makeDateAt(dateFilter.to, 0, 0);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(toD);
                } else if (dateFilter.from && !dateFilter.to) {
                    const fromD = makeDateAt(dateFilter.from, 0, 0);
                    const toD = new Date(fromD); toD.setDate(toD.getDate() + 30);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(toD);
                } else if (!dateFilter.from && dateFilter.to) {
                    const toD = makeDateAt(dateFilter.to, 0, 0);
                    const fromD = new Date(toD); fromD.setDate(fromD.getDate() - 30);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(toD);
                } else {
                    // default last 30 days
                    const today = new Date(); today.setHours(0,0,0,0);
                    const fromD = new Date(today); fromD.setDate(fromD.getDate() - 30);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(today);
                }

                params.set('start', startStr);
                params.set('finish', finishStr);
                if (flowsFilter.length) params.set('threads', flowsFilter.join(','));
                if (statusFilter !== 'all') params.set('service_status_id', String(statusKeyToId(statusFilter)));
                if (citiesFilter.length) params.set('cities', citiesFilter.join(','));
                if (phoneQuery && phoneQuery.trim()) params.set('query', phoneQuery.trim());
                if (wmFilter.length) params.set('users', wmFilter.join(','));
                if (paidFilter !== 'all') params.set('paid_commission', paidFilter === 'paid' ? 'true' : 'false');
                if (selectedOfferValue) params.set('offer_id', selectedOfferValue);

                const path = `/api/v2/leads/stats/dynamics?${params.toString()}`;
                const { ok, data } = await http.get(path);
                if (cancelled) return;
                if (ok && Array.isArray(data)) {
                    const hourlyMode = startStr === finishStr;
                    const mapped = data.map(row => {
                        const d = new Date(row.bucket);
                        const label = hourlyMode ? `${pad(d.getHours())}:00` : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
                        return { date: label, leads: Number(row.total || 0), confirmed: Number(row.realized || 0) };
                    });
                    setLeadDynamicsData(mapped);
                } else {
                    setLeadDynamicsData([]);
                }
            } catch (e) {
                if (!cancelled) { setDynamicsError('Не удалось загрузить динамику'); setLeadDynamicsData([]); }
            } finally {
                if (!cancelled) setLoadingDynamics(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowsFilter, statusFilter, citiesFilter, dateFilter.from, dateFilter.to, phoneQuery, wmFilter, paidFilter, selectedOfferValue]);

    // (selectedLeads, bulkStats already defined above for bulk actions)

    const handleMarkPaid = () => {
        if (selectAllFiltered) {
            const eligible = filterSummary?.realized_unpaid?.count || 0;
            if (loadingFilterSummary || eligible === 0) return;
            setShowPayConfirm(true);
            return;
        }
        if (!bulkStats.eligibleCount) return;
        setShowPayConfirm(true);
    };

    const confirmMarkPaid = async () => {
        setPayError('');
        setIsPaying(true);
        try {
            if (selectAllFiltered) {
                // Pay by filters via PATCH with query params
                const params = new URLSearchParams();
                if (flowsFilter.length) params.set('threads', flowsFilter.join(','));
                if (statusFilter !== 'all') {
                    const sid = String(statusKeyToId(statusFilter));
                    params.set('service_status_id', sid);
                    // include possible crm_status_id for backend compatibility
                    params.set('crm_status_id', sid);
                }
                if (citiesFilter.length) params.set('cities', citiesFilter.join(','));
                if (dateFilter.from) params.set('created_from', dateFilter.from);
                if (dateFilter.to) params.set('created_to', dateFilter.to);
                if (phoneQuery && phoneQuery.trim()) params.set('query', phoneQuery.trim());
                if (wmFilter.length) params.set('users', wmFilter.join(','));
                if (paidFilter !== 'all') params.set('paid_commission', paidFilter === 'paid' ? 'true' : 'false');
                if (selectedOfferValue) params.set('offer_id', selectedOfferValue);

                const path = `/api/v2/leads/stats/pay_lids?${params.toString()}`;
                // Some backends require a body even in filter mode; send an empty array to satisfy schema
                const { ok } = await http.patch(path, []);
                if (ok) {
                    // refresh table and summary
                    setRefreshNonce(n => n + 1);
                    // small inline re-fetch of summary
                    try {
                        setLoadingFilterSummary(true);
                        const sumParams = (p => p)(params); // reuse
                        const { ok: okSum, data } = await http.get(`/api/v2/leads/stats/filter_summary?${sumParams.toString()}`);
                        setFilterSummary(okSum ? data : null);
                    } finally {
                        setLoadingFilterSummary(false);
                    }
                } else {
                    setPayError('Не удалось отметить лиды оплаченными');
                }
            } else {
                // Pay selected leads by IDs
                const ids = Array.from(selected, (x) => String(x));
                const { ok, data } = await http.patch(`/api/v2/leads/stats/pay_lids`, ids);
                if (ok) {
                    const now = new Date();
                    setTableItems(prev => prev.map(l => (selected.has(l.id) && l.realized && !l.paidFlag) ? { ...l, paidFlag: true, paidDate: now } : l));
                    // Update selectedMeta to reflect paid status
                    setSelectedMeta(prevMeta => {
                        const map = new Map(prevMeta);
                        Array.from(selected).forEach(id => {
                            if (map.has(String(id))) {
                                const m = map.get(String(id));
                                map.set(String(id), { ...m, paidFlag: true });
                            }
                        });
                        return map;
                    });
                    setSelected(new Set());
                } else {
                    setPayError('Не удалось отметить выбранные лиды оплаченными');
                }
            }
        } catch (e) {
            setPayError('Произошла ошибка при оплате');
        } finally {
            setIsPaying(false);
            setShowPayConfirm(false);
        }
    };

    const toggleSelect = (lead) => {
        const id = String(lead.id);
        // Switching to manual row selection disables global select
        if (selectAllFiltered) {
            setSelectAllFiltered(false);
            setFilterSummary(null);
            setFilterSummaryError('');
            setLoadingFilterSummary(false);
            setSelectedMeta(new Map());
        }
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                setSelectedMeta(prevMeta => {
                    const map = new Map(prevMeta);
                    map.delete(id);
                    return map;
                });
            } else {
                next.add(id);
                setSelectedMeta(prevMeta => {
                    const map = new Map(prevMeta);
                    map.set(id, {
                        commission: Number(lead.commission || 0),
                        realized: Boolean(lead.realized),
                        paidFlag: Boolean(lead.paidFlag),
                        burned: Boolean(lead.burned)
                    });
                    return map;
                });
            }
            return next;
        });
    };

    // Build params for stats endpoints with start/finish period and active filters
    const buildStatsParams = () => {
        const params = new URLSearchParams();
        const pad = (n) => String(n).padStart(2, '0');
        const toLocalStart = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
        const makeDateAt = (dateStr, h = 0, m = 0) => {
            const d = new Date(dateStr + 'T00:00:00');
            d.setHours(h, m, 0, 0);
            return d;
        };
        let startStr = '', finishStr = '';
        if (dateFilter.from && dateFilter.to) {
            const fromD = makeDateAt(dateFilter.from, 0, 0);
            const toD = makeDateAt(dateFilter.to, 0, 0);
            startStr = toLocalStart(fromD);
            finishStr = toLocalStart(toD);
        } else if (dateFilter.from && !dateFilter.to) {
            const fromD = makeDateAt(dateFilter.from, 0, 0);
            const toD = new Date(fromD); toD.setDate(toD.getDate() + 30);
            startStr = toLocalStart(fromD);
            finishStr = toLocalStart(toD);
        } else if (!dateFilter.from && dateFilter.to) {
            const toD = makeDateAt(dateFilter.to, 0, 0);
            const fromD = new Date(toD); fromD.setDate(fromD.getDate() - 30);
            startStr = toLocalStart(fromD);
            finishStr = toLocalStart(toD);
        } else {
            const today = new Date(); today.setHours(0,0,0,0);
            const fromD = new Date(today); fromD.setDate(fromD.getDate() - 30);
            startStr = toLocalStart(fromD);
            finishStr = toLocalStart(today);
        }
        params.set('start', startStr);
        params.set('finish', finishStr);
        if (flowsFilter.length) params.set('threads', flowsFilter.join(','));
        if (statusFilter !== 'all') params.set('service_status_id', String(statusKeyToId(statusFilter)));
        if (citiesFilter.length) params.set('cities', citiesFilter.join(','));
        if (phoneQuery && phoneQuery.trim()) params.set('query', phoneQuery.trim());
        if (wmFilter.length) params.set('users', wmFilter.join(','));
        if (paidFilter !== 'all') params.set('paid_commission', paidFilter === 'paid' ? 'true' : 'false');
        if (selectedOfferValue) params.set('offer_id', selectedOfferValue);
        return params;
    };

    // Build params specifically for /filter_summary: use created_from/created_to instead of start/finish
    const buildFilterSummaryParams = () => {
        const params = new URLSearchParams();
        const pad = (n) => String(n).padStart(2, '0');
        const toLocalStart = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
        const makeDateAt = (dateStr, h = 0, m = 0) => {
            const d = new Date(dateStr + 'T00:00:00');
            d.setHours(h, m, 0, 0);
            return d;
        };
        let createdFrom = '', createdTo = '';
        if (dateFilter.from && dateFilter.to) {
            const fromD = makeDateAt(dateFilter.from, 0, 0);
            const toD = makeDateAt(dateFilter.to, 0, 0);
            createdFrom = toLocalStart(fromD);
            createdTo = toLocalStart(toD);
        } else if (dateFilter.from && !dateFilter.to) {
            const fromD = makeDateAt(dateFilter.from, 0, 0);
            const toD = new Date(fromD); toD.setDate(toD.getDate() + 30);
            createdFrom = toLocalStart(fromD);
            createdTo = toLocalStart(toD);
        } else if (!dateFilter.from && dateFilter.to) {
            const toD = makeDateAt(dateFilter.to, 0, 0);
            const fromD = new Date(toD); fromD.setDate(fromD.getDate() - 30);
            createdFrom = toLocalStart(fromD);
            createdTo = toLocalStart(toD);
        } else {
            const today = new Date(); today.setHours(0,0,0,0);
            const fromD = new Date(today); fromD.setDate(fromD.getDate() - 30);
            createdFrom = toLocalStart(fromD);
            createdTo = toLocalStart(today);
        }
        params.set('created_from', createdFrom);
        params.set('created_to', createdTo);
        if (flowsFilter.length) params.set('threads', flowsFilter.join(','));
        if (statusFilter !== 'all') params.set('service_status_id', String(statusKeyToId(statusFilter)));
        if (citiesFilter.length) params.set('cities', citiesFilter.join(','));
        if (phoneQuery && phoneQuery.trim()) params.set('query', phoneQuery.trim());
        if (wmFilter.length) params.set('users', wmFilter.join(','));
        if (paidFilter !== 'all') params.set('paid_commission', paidFilter === 'paid' ? 'true' : 'false');
        if (selectedOfferValue) params.set('offer_id', selectedOfferValue);
        return params;
    };

    const handleToggleSelectAllFiltered = async (e) => {
        const checked = e.target.checked;
        if (checked) {
            setSelectAllFiltered(true);
            setSelected(new Set()); // clear row selections
            setSelectedMeta(new Map()); // clear cached meta when entering global mode
            setLoadingFilterSummary(true); setFilterSummaryError('');
            try {
                const params = buildFilterSummaryParams();
                const { ok, data } = await http.get(`/api/v2/leads/stats/filter_summary?${params.toString()}`);
                setFilterSummary(ok ? data : null);
            } catch (err) {
                setFilterSummaryError('Не удалось получить сводку по фильтрам');
                setFilterSummary(null);
            } finally {
                setLoadingFilterSummary(false);
            }
        } else {
            setSelectAllFiltered(false);
            setFilterSummary(null);
            setFilterSummaryError('');
            setLoadingFilterSummary(false);
            setSelected(new Set());
            setSelectedMeta(new Map()); // also clear manual selections cache when leaving global mode
        }
    };

    // Refresh summary automatically when filters change and global selection is active
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!selectAllFiltered) return;
            setLoadingFilterSummary(true); setFilterSummaryError('');
            try {
                const params = buildFilterSummaryParams();
                const { ok, data } = await http.get(`/api/v2/leads/stats/filter_summary?${params.toString()}`);
                if (!cancelled) setFilterSummary(ok ? data : null);
            } catch (e) {
                if (!cancelled) { setFilterSummaryError('Не удалось получить сводку по фильтрам'); setFilterSummary(null); }
            } finally {
                if (!cancelled) setLoadingFilterSummary(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectAllFiltered, flowsFilter, statusFilter, citiesFilter, dateFilter.from, dateFilter.to, phoneQuery, wmFilter, paidFilter, selectedOfferValue]);

    const changeSort = (field) => {
        setSort(prev => {
            if (prev.field === field) return { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            return { field, dir: 'desc' };
        });
    };

    const commissionCell = (l) => {
        if (l.burned) return <span className="text-gray-400 line-through">{l.commission}</span>;
        if (!l.realized) return <span className="text-orange-600 font-semibold">{l.commission}</span>;
        return <span className="text-green-600 font-semibold">{l.commission}</span>;
    };

    const paidIcon = (l) => {
        if (l.burned) return <Icon name="Ban" size={14} className="text-gray-400" />;
        if (!l.realized) return <Icon name="Clock" size={14} className="text-orange-400" />;
        return l.paidFlag ? <Icon name="CheckCircle" size={14} className="text-green-500" /> : <Icon name="Circle" size={14} className="text-gray-300" />;
    };

    const sourceIcon = (name) => {
        switch(name){
            case 'Avito': return 'AvitoLogo';
            case 'Яндекс.Директ': return 'Search';
            case 'Target': return 'Target';
            case 'SEO': return 'TrendingUp';
            case 'Телефония': return 'Phone';
            case 'Лендинги': return 'Globe';
            default: return 'Circle';
        }
    };

    // totalPages moved above with memo

    const statusMeta = {
        confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Подтвержден', dot: 'bg-green-500' },
        in_work: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'В работе', dot: 'bg-blue-500' },
        assigned: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Назначен', dot: 'bg-yellow-500' },
        client_refusal: { bg: 'bg-red-100', text: 'text-red-700', label: 'Отказ клиента', dot: 'bg-red-500' },
        low_quality: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Некачественный', dot: 'bg-gray-500' }
    };

    const renderStatusBadge = (status) => {
        const cfg = statusMeta[status];
        if (!cfg) return <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium bg-gray-100 text-gray-700"><span className="w-1.5 h-1.5 rounded-full mr-1 bg-gray-500" />Новый</span>;
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                {cfg.label}
            </span>
        );
    };

    const fmtMoney = (n) => new Intl.NumberFormat('ru-RU').format(n);
    const selectedLeads = useMemo(() => tableItems.filter(l => selected.has(l.id)), [tableItems, selected]);
    const bulkStats = useMemo(() => {
        let realizedUnpaid = 0; let realizedPaid = 0; let hold = 0; let eligibleCount = 0;
        selectedMeta.forEach((m) => {
            const commission = Number(m.commission || 0);
            if (m.burned) return;
            if (!m.realized) { hold += commission; return; }
            if (m.realized && !m.paidFlag) { realizedUnpaid += commission; eligibleCount++; }
            if (m.paidFlag) realizedPaid += commission;
        });
        return { realizedUnpaid, realizedPaid, hold, eligibleCount };
    }, [selectedMeta]);

    // Carousel data
    const [carouselIndex, setCarouselIndex] = useState(0); // 0 dynamics, 1 cities

    // Fetch commission breakdown for chart (backend)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingCommission(true); setCommissionError('');
            try {
                const params = new URLSearchParams();
                const pad = (n) => String(n).padStart(2, '0');
                const toLocalStart = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
                const makeDateAt = (dateStr, h = 0, m = 0) => {
                    const d = new Date(dateStr + 'T00:00:00');
                    d.setHours(h, m, 0, 0);
                    return d;
                };
                let startStr = '', finishStr = '';
                if (dateFilter.from && dateFilter.to) {
                    const fromD = makeDateAt(dateFilter.from, 0, 0);
                    const toD = makeDateAt(dateFilter.to, 0, 0);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(toD);
                } else if (dateFilter.from && !dateFilter.to) {
                    const fromD = makeDateAt(dateFilter.from, 0, 0);
                    const toD = new Date(fromD); toD.setDate(toD.getDate() + 30);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(toD);
                } else if (!dateFilter.from && dateFilter.to) {
                    const toD = makeDateAt(dateFilter.to, 0, 0);
                    const fromD = new Date(toD); fromD.setDate(fromD.getDate() - 30);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(toD);
                } else {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const fromD = new Date(today); fromD.setDate(fromD.getDate() - 30);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(today);
                }

                params.set('start', startStr);
                params.set('finish', finishStr);
                if (flowsFilter.length) params.set('threads', flowsFilter.join(','));
                if (statusFilter !== 'all') params.set('service_status_id', String(statusKeyToId(statusFilter)));
                if (citiesFilter.length) params.set('cities', citiesFilter.join(','));
                if (phoneQuery && phoneQuery.trim()) params.set('query', phoneQuery.trim());
                if (wmFilter.length) params.set('users', wmFilter.join(','));
                if (paidFilter !== 'all') params.set('paid_commission', paidFilter === 'paid' ? 'true' : 'false');
                if (selectedOfferValue) params.set('offer_id', selectedOfferValue);

                const path = `/api/v2/leads/stats/dynamics_commission?${params.toString()}`;
                const { ok, data } = await http.get(path);
                if (cancelled) return;
                if (ok && Array.isArray(data)) {
                    const hourlyMode = startStr === finishStr;
                    const mapped = data.map(row => {
                        const d = new Date(row.bucket);
                        const label = hourlyMode ? `${pad(d.getHours())}:00` : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
                        return {
                            date: label,
                            hold: Number(row.hold_commission || 0),
                            realizedUnpaid: Number(row.realized_unpaid_commission || 0),
                            realizedPaid: Number(row.realized_paid_commission || 0)
                        };
                    });
                    setCommissionStatsData(mapped);
                } else {
                    setCommissionStatsData([]);
                }
            } catch (e) {
                if (!cancelled) { setCommissionError('Не удалось загрузить комиссию'); setCommissionStatsData([]); }
            } finally {
                if (!cancelled) setLoadingCommission(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowsFilter, statusFilter, citiesFilter, dateFilter.from, dateFilter.to, phoneQuery, wmFilter, paidFilter, selectedOfferValue]);

    // Fetch cities distribution (backend)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingCities(true); setCitiesError('');
            try {
                const params = new URLSearchParams();
                const pad = (n) => String(n).padStart(2, '0');
                const toLocalStart = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
                const makeDateAt = (dateStr, h = 0, m = 0) => {
                    const d = new Date(dateStr + 'T00:00:00');
                    d.setHours(h, m, 0, 0);
                    return d;
                };
                let startStr = '', finishStr = '';
                if (dateFilter.from && dateFilter.to) {
                    const fromD = makeDateAt(dateFilter.from, 0, 0);
                    const toD = makeDateAt(dateFilter.to, 0, 0);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(toD);
                } else if (dateFilter.from && !dateFilter.to) {
                    const fromD = makeDateAt(dateFilter.from, 0, 0);
                    const toD = new Date(fromD); toD.setDate(toD.getDate() + 30);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(toD);
                } else if (!dateFilter.from && dateFilter.to) {
                    const toD = makeDateAt(dateFilter.to, 0, 0);
                    const fromD = new Date(toD); fromD.setDate(fromD.getDate() - 30);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(toD);
                } else {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const fromD = new Date(today); fromD.setDate(fromD.getDate() - 30);
                    startStr = toLocalStart(fromD);
                    finishStr = toLocalStart(today);
                }

                params.set('created_from', startStr);
                params.set('created_to', finishStr);
                params.set('with_detail', 'false');
                if (flowsFilter.length) params.set('threads', flowsFilter.join(','));
                if (statusFilter !== 'all') params.set('service_status_id', String(statusKeyToId(statusFilter)));
                if (citiesFilter.length) params.set('cities', citiesFilter.join(','));
                if (phoneQuery && phoneQuery.trim()) params.set('query', phoneQuery.trim());
                if (wmFilter.length) params.set('users', wmFilter.join(','));
                if (paidFilter !== 'all') params.set('paid_commission', paidFilter === 'paid' ? 'true' : 'false');
                if (selectedOfferValue) params.set('offer_id', selectedOfferValue);

                const path = `/api/v2/leads/stats/by-cities?${params.toString()}`;
                const { ok, data } = await http.get(path);
                if (cancelled) return;
                if (ok && Array.isArray(data)) {
                    const mapped = data.map(row => ({ name: row.city || 'Нет города', value: Number(row.total || 0) }))
                        .sort((a, b) => b.value - a.value);
                    setCitiesStatsData(mapped);
                } else {
                    setCitiesStatsData([]);
                }
            } catch (e) {
                if (!cancelled) { setCitiesError('Не удалось загрузить города'); setCitiesStatsData([]); }
            } finally {
                if (!cancelled) setLoadingCities(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowsFilter, statusFilter, citiesFilter, dateFilter.from, dateFilter.to, phoneQuery, wmFilter, paidFilter, selectedOfferValue]);

    // Measure container to decide how many cities we can show (10–15 typical)
    useEffect(() => {
        const el = citiesChartRef.current;
        if (!el) return;
        const compute = () => {
            const width = el.clientWidth || 0;
            // Each bar target width ~ 34px + spacing; keep between 10 and 15
            const approxBar = 34;
            const padding = 40; // chart paddings and y-axis
            const possible = Math.max(1, Math.floor((width - padding) / approxBar));
            setMaxCitiesToShow(Math.min(15, Math.max(10, possible)));
        };
        compute();
        const ro = new ResizeObserver(compute);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const totalSlides = 3;
    const goPrev = () => setCarouselIndex(i => Math.max(0, i - 1));
    const goNext = () => setCarouselIndex(i => Math.min(totalSlides - 1, i + 1));
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);
    const CarouselNav = () => (
        <div className="flex items-center gap-2 mt-2 justify-center">
            {Array.from({ length: totalSlides }).map((_, i) => (
                <button key={i} onClick={() => setCarouselIndex(i)} className={`w-2.5 h-2.5 rounded-full nav-transition ${carouselIndex === i ? 'bg-yellow-500' : 'bg-gray-300 hover:bg-gray-400'}`}></button>
            ))}
        </div>
    );

    const chartCardBase = "bg-white rounded-lg shadow-sm border border-gray-200 p-4";

    // Client-side sorting for current page items (backend pagination)
    const currentPageItems = useMemo(() => {
        const arr = [...tableItems];
        arr.sort((a, b) => {
            if (sort.field === 'created') return sort.dir === 'asc' ? (a.created - b.created) : (b.created - a.created);
            if (sort.field === 'commission') return sort.dir === 'asc' ? a.commission - b.commission : b.commission - a.commission;
            return 0;
        });
        return arr;
    }, [tableItems, sort]);

    const handleCopyId = async (e, id) => {
        e.stopPropagation();
        try {
            const text = String(id ?? '');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text; document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); } catch {}
                document.body.removeChild(ta);
            }
            setCopiedId(text);
            setTimeout(() => setCopiedId(''), 1500);
        } catch {
            // no-op
        }
    };

    if (userRole !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center shadow-sm">
                    <Icon name="Lock" size={38} className="mx-auto mb-4 text-gray-400" />
                    <h1 className="text-lg font-semibold mb-2 text-gray-800">Доступ ограничен</h1>
                    <p className="text-[13px] text-gray-600 mb-4">У вас нет прав для просмотра административной статистики.</p>
                    <a href="/" className="inline-block px-4 h-9 leading-9 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[12px] font-medium nav-transition">На главную</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 relative p-4">
            {/* Filters Panel */}
            <div ref={dropdownRef} className="bg-white border border-gray-200 rounded-lg p-4 mb-2 text-[12px] grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {/* Date Range */}
                <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Период</div>
                    <DateRangeCompact value={dateFilter} onChange={(v) => { setDateFilter(v); setPage(1); }} />
                </div>
                {/* Phone search */}
                <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Поиск по телефону</div>
                    <div className="relative">
                        <input value={phoneQuery} onChange={e => { setPhoneQuery(e.target.value); setPage(1); }} placeholder="Например: +7999..." className="w-full h-8 px-8 py-0 border border-gray-300 rounded bg-white text-[12px] leading-8 focus:border-yellow-400 focus:outline-none" />
                        <Icon name="Search" size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
                {/* Cities multi-select */}
                <div className="relative">
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Города</div>
                    <button onClick={() => setOpenDropdown(openDropdown === 'cities' ? null : 'cities')} className="w-full h-8 px-3 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between hover:border-yellow-400 nav-transition">
                        <span className="truncate">{citiesFilter.length ? `Выбрано: ${citiesFilter.length}` : 'Все города'}</span>
                        <Icon name={openDropdown === 'cities' ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-gray-400" />
                    </button>
                    {openDropdown === 'cities' && (
                        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg p-2">
                            <input value={citySearch} onChange={e => setCitySearch(e.target.value)} placeholder="Поиск..." className="mb-2 w-full h-7 text-[11px] px-2 border border-gray-300 rounded focus:border-yellow-400 focus:outline-none" />
                            {(allCities.length ? allCities : ['Москва', 'СПб', 'Екатеринбург', 'Казань', 'Новосибирск', 'Краснодар']).filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 300).map(city => {
                                const active = citiesFilter.includes(city);
                                return (
                                    <button key={city} onClick={() => { setCitiesFilter(prev => active ? prev.filter(x => x !== city) : [...prev, city]); }} className={`w-full text-left px-2 py-1 rounded nav-transition text-[11px] ${active ? 'bg-yellow-100 text-gray-800' : 'hover:bg-gray-50 text-gray-600'}`}>{city}</button>
                                );
                            })}
                            {citiesFilter.length > 0 && (
                                <div className="mt-2 flex justify-between">
                                    <button onClick={() => setCitiesFilter([])} className="text-[10px] text-red-500 hover:underline">Сбросить</button>
                                    <button onClick={() => setOpenDropdown(null)} className="text-[10px] text-yellow-600 hover:underline">Готово</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Flows multi-select */}
                <div className="relative">
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Потоки</div>
                    <button onClick={() => setOpenDropdown(openDropdown === 'flows' ? null : 'flows')} className="w-full h-8 px-3 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between hover:border-yellow-400 nav-transition">
                        <span className="truncate">{flowsFilter.length ? `Выбрано: ${flowsFilter.length}` : 'Все потоки'}</span>
                        <Icon name={openDropdown === 'flows' ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-gray-400" />
                    </button>
                    {openDropdown === 'flows' && (
                        <div className="absolute z-30 mt-1 w-full max-h-72 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg p-2">
                            <input value={flowSearch} onChange={e => setFlowSearch(e.target.value)} placeholder="Поиск по ID или имени" className="mb-2 w-full h-7 text-[11px] px-2 border border-gray-300 rounded focus:border-yellow-400 focus:outline-none" />
                            {isLoadingFlows ? (
                                <div className="text-[11px] text-gray-500 p-2">Загрузка...</div>
                            ) : (backendFlows.length ? backendFlows : mockFlows).filter(f => f.name.toLowerCase().includes(flowSearch.toLowerCase()) || String(f.id).toLowerCase().includes(flowSearch.toLowerCase())).map(f => {
                                const active = flowsFilter.includes(f.id);
                                const iconName = (() => {
                                    const label = mapTrafficSourceLabel(f.sourceType);
                                    switch (label) {
                                        case 'Avito': return 'AvitoLogo';
                                        case 'Яндекс.Директ': return 'Search';
                                        case 'Target': return 'Target';
                                        case 'SEO': return 'TrendingUp';
                                        case 'Телефония': return 'Phone';
                                        case 'Лендинги': return 'Globe';
                                        default: return 'Circle';
                                    }
                                })();
                                return (
                                    <button key={f.id} onClick={() => { setFlowsFilter(prev => active ? prev.filter(x => x !== f.id) : [...prev, f.id]); }} className={`w-full text-left px-2 py-1 rounded nav-transition flex flex-col items-start ${active ? 'bg-yellow-100 text-gray-800' : 'hover:bg-gray-50 text-gray-700'}`}>
                                        <span className="text-[11px] font-medium truncate w-full">{f.name}</span>
                                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                            <Icon name={iconName} size={12} />
                                            <span className="truncate">{mapTrafficSourceLabel(f.sourceType)}</span>
                                        </span>
                                    </button>
                                );
                            })}
                            <div className="mt-2 flex justify-between">
                                <button onClick={() => setFlowsFilter([])} className="text-[10px] text-red-500 hover:underline">Сбросить</button>
                                <button onClick={() => setOpenDropdown(null)} className="text-[10px] text-yellow-600 hover:underline">Готово</button>
                            </div>
                        </div>
                    )}
                </div>
                {/* Webmasters multi-select */}
                <div className="relative">
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Вебмастеры</div>
                    <button onClick={() => setOpenDropdown(openDropdown === 'webmasters' ? null : 'webmasters')} className="w-full h-8 px-3 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between hover:border-yellow-400 nav-transition">
                        <span className="truncate">{wmFilter.length ? `Выбрано: ${wmFilter.length}` : 'Все вебмастеры'}</span>
                        <Icon name={openDropdown === 'webmasters' ? 'ChevronUp' : 'ChevronDown'} size={14} className="text-gray-400" />
                    </button>
                    {openDropdown === 'webmasters' && (
                        <div className="absolute z-30 mt-1 w-full max-h-72 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg p-2">
                            <input value={wmSearch} onChange={e => setWmSearch(e.target.value)} placeholder="Поиск по имени или ID" className="mb-2 w-full h-7 text-[11px] px-2 border border-gray-300 rounded focus:border-yellow-400 focus:outline-none" />
                            {isLoadingWebmasters ? (
                                <div className="text-[11px] text-gray-500 p-2">Загрузка...</div>
                            ) : (backendWebmasters.length ? backendWebmasters : mockWebmasters).filter(w => (w.name || '').toLowerCase().includes(wmSearch.toLowerCase()) || String(w.id).toLowerCase().includes(wmSearch.toLowerCase())).map(w => {
                                const active = wmFilter.includes(w.id);
                                return (
                                    <button key={w.id} onClick={() => { setWmFilter(prev => active ? prev.filter(x => x !== w.id) : [...prev, w.id]); }} className={`w-full text-left px-2 py-1 rounded nav-transition flex flex-col items-start ${active ? 'bg-yellow-100 text-gray-800' : 'hover:bg-gray-50 text-gray-700'}`}>
                                        <span className="text-[11px] font-medium">{w.name}</span>
                                        <span className="text-[10px] font-mono text-gray-400">{w.id}</span>
                                    </button>
                                );
                            })}
                            <div className="mt-2 flex justify-between">
                                <button onClick={() => setWmFilter([])} className="text-[10px] text-red-500 hover:underline">Сбросить</button>
                                <button onClick={() => setOpenDropdown(null)} className="text-[10px] text-yellow-600 hover:underline">Готово</button>
                            </div>
                        </div>
                    )}
                </div>
                {/* Offer select */}
                <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Оффер</div>
                    <select value={selectedOfferValue} onChange={e => { setOfferFilter([e.target.value || '']); setPage(1); }} className="w-full h-8 px-2 py-0 border border-gray-300 rounded bg-white text-[12px] leading-8 focus:border-yellow-400 focus:outline-none">
                        <option value="">Все офферы</option>
                        {(isLoadingOffers ? [] : backendOffers).map(of => <option key={of.offer_id} value={String(of.offer_id)}>{of.title}</option>)}
                        {(!isLoadingOffers && backendOffers.length === 0 && mockOffers?.length) ? mockOffers.map(title => <option key={title} value="">{title}</option>) : null}
                    </select>
                </div>
                {/* Status select */}
                <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Статус</div>
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="w-full h-8 px-2 py-0 border border-gray-300 rounded bg-white text-[12px] leading-8 focus:border-yellow-400 focus:outline-none">
                        <option value="all">Все</option>
                        <option value="confirmed">Подтвержден</option>
                        <option value="in_work">В работе</option>
                        <option value="assigned">Назначен</option>
                        <option value="client_refusal">Отказ клиента</option>
                        <option value="low_quality">Некачественный</option>
                    </select>
                </div>
                {/* Paid select */}
                <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Оплата</div>
                    <select value={paidFilter} onChange={e => { setPaidFilter(e.target.value); setPage(1); }} className="w-full h-8 px-2 py-0 border border-gray-300 rounded bg-white text-[12px] leading-8 focus:border-green-500 focus:outline-none">
                        <option value="all">Все</option>
                        <option value="paid">Оплаченные</option>
                        <option value="unpaid">Неоплаченные</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button onClick={() => { setCitiesFilter([]); setFlowsFilter([]); setWmFilter([]); setOfferFilter([]); setStatusFilter('all'); setPaidFilter('all'); setFlowSearch(''); setWmSearch(''); setCitySearch(''); setPhoneQuery(''); setOpenDropdown(null); setPage(1); }} className="px-3 h-8 rounded-md border border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600 text-[11px] nav-transition">Сброс</button>
                </div>
            </div>
            {/* Chips under filters */}
            {(citiesFilter.length || flowsFilter.length || wmFilter.length) ? (
                <div className="flex flex-wrap gap-2 mb-3">
                    {citiesFilter.map(c => (
                        <button key={c} onClick={() => setCitiesFilter(prev => prev.filter(x => x !== c))} className="group flex items-center h-6 pl-2 pr-1 rounded-md bg-gray-100 text-[11px] text-gray-700 hover:bg-yellow-400 hover:text-white nav-transition">{c}<span className="ml-1 px-1 text-gray-400 group-hover:text-white">×</span></button>
                    ))}
                    {flowsFilter.map(fid => {
                        const meta = (backendFlows.length ? backendFlows : mockFlows).find(f => String(f.id) === String(fid)); const label = meta ? meta.name : fid; return (
                            <button key={fid} onClick={() => setFlowsFilter(prev => prev.filter(x => x !== fid))} className="group flex items-center h-6 pl-2 pr-1 rounded-md bg-gray-100 text-[11px] text-gray-700 hover:bg-yellow-400 hover:text-white nav-transition max-w-[200px]" title={label}><span className="truncate max-w-[150px]">{label}</span><span className="ml-1 px-1 text-gray-400 group-hover:text-white">×</span></button>
                        );
                    })}
                    {wmFilter.map(wid => {
                        const meta = (backendWebmasters.length ? backendWebmasters : mockWebmasters).find(w => String(w.id) === String(wid)); const label = meta ? meta.name : wid; return (
                            <button key={wid} onClick={() => setWmFilter(prev => prev.filter(x => x !== wid))} className="group flex items-center h-6 pl-2 pr-1 rounded-md bg-gray-100 text-[11px] text-gray-700 hover:bg-yellow-400 hover:text-white nav-transition max-w-[180px]" title={label}><span className="truncate max-w-[140px]">{label}</span><span className="ml-1 px-1 text-gray-400 group-hover:text-white">×</span></button>
                        );
                    })}
                </div>
            ) : null}

            {/* Charts Carousel (moved below filters so filters apply) */}
            <div className="mb-4">
                <div className="relative overflow-hidden">
                    <button onClick={goPrev} disabled={carouselIndex === 0} aria-label="prev" className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-2 z-10 w-9 h-9 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-sm border border-yellow-300 text-gray-900 items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed nav-transition">
                        <Icon name="ChevronLeft" size={18} />
                    </button>
                    <button onClick={goNext} disabled={carouselIndex === totalSlides - 1} aria-label="next" className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-2 z-10 w-9 h-9 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-sm border border-yellow-300 text-gray-900 items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed nav-transition">
                        <Icon name="ChevronRight" size={18} />
                    </button>
                    <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
                        {/* Slide 1: Lead dynamics */}
                        <div className="w-full flex-shrink-0 pr-4">
                            <div className={chartCardBase}>
                                <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold text-gray-800">Динамика лидов</h3><span className="text-[11px] text-gray-400">{leadDynamicsData.length}</span></div>
                                <div className="h-56 -mx-2 px-2">
                                    {loadingDynamics ? (
                                        <div className="h-full flex items-center justify-center text-[12px] text-gray-500">Загрузка…</div>
                                    ) : dynamicsError ? (
                                        <div className="h-full flex items-center justify-center text-[12px] text-red-500">{dynamicsError}</div>
                                    ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={leadDynamicsData} margin={{ top: 10, right: 20, left: 0, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} width={30} />
                                            <ReTooltip cursor={false} content={({ active, payload, label }) => {
                                                if (!active || !payload) return null; const leadsRow = payload.find(p => p.dataKey === 'leads'); const confRow = payload.find(p => p.dataKey === 'confirmed');
                                                return <div className="bg-white border border-yellow-300 rounded-md shadow-sm p-2 text-[11px]"><div className="text-[10px] text-gray-400 mb-1 font-mono">{label}</div><div className="flex justify-between"><span className="text-gray-500">Всего</span><span className="font-semibold">{leadsRow?.value}</span></div><div className="flex justify-between"><span className="text-gray-500">Подтв.</span><span className="font-semibold text-green-600">{confRow?.value}</span></div></div>;
                                            }} />
                                            <Line dataKey="leads" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3, fill: '#f59e0b' }} />
                                            <Line dataKey="confirmed" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Slide 2: Commission breakdown */}
                        <div className="w-full flex-shrink-0 pr-4">
                            <div className={chartCardBase}>
                                <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold text-gray-800">Комиссия по статусам</h3><span className="text-[11px] text-gray-400">{commissionStatsData.length}</span></div>
                                <div className="h-56 -mx-2 px-2">
                                    {loadingCommission ? (
                                        <div className="h-full flex items-center justify-center text-[12px] text-gray-500">Загрузка…</div>
                                    ) : commissionError ? (
                                        <div className="h-full flex items-center justify-center text-[12px] text-red-500">{commissionError}</div>
                                    ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={commissionStatsData} margin={{ top: 10, right: 10, left: 0, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} width={40} />
                                            <ReTooltip cursor={false} content={({ active, payload, label }) => {
                                                if (!active || !payload) return null; const hold = payload.find(p => p.dataKey === 'hold'); const ru = payload.find(p => p.dataKey === 'realizedUnpaid'); const rp = payload.find(p => p.dataKey === 'realizedPaid');
                                                return <div className="bg-white border border-yellow-300 rounded-md shadow-sm p-2 text-[11px]"><div className="text-[10px] text-gray-400 mb-1 font-mono">{label}</div><div className="flex justify-between"><span className="text-gray-500">Холд</span><span className="font-semibold text-orange-600">{fmtMoney(hold?.value || 0)} ₽</span></div><div className="flex justify-between"><span className="text-gray-500">Не выплачено</span><span className="font-semibold text-green-700">{fmtMoney(ru?.value || 0)} ₽</span></div><div className="flex justify-between"><span className="text-gray-500">Выплачено</span><span className="font-semibold text-green-600">{fmtMoney(rp?.value || 0)} ₽</span></div></div>;
                                            }} />
                                            <Bar dataKey="hold" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="realizedUnpaid" stackId="a" fill="#84cc16" />
                                            <Bar dataKey="realizedPaid" stackId="a" fill="#10b981" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Slide 3: City distribution */}
                        <div className="w-full flex-shrink-0 pr-4">
                            <div className={chartCardBase} ref={citiesChartRef}>
                                <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold text-gray-800">Распределение по городам</h3><span className="text-[11px] text-gray-400">{citiesStatsData.length}</span></div>
                                <div className="h-56 -mx-2 px-2">
                                    {loadingCities ? (
                                        <div className="h-full flex items-center justify-center text-[12px] text-gray-500">Загрузка…</div>
                                    ) : citiesError ? (
                                        <div className="h-full flex items-center justify-center text-[12px] text-red-500">{citiesError}</div>
                                    ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={citiesStatsData.slice(0, maxCitiesToShow)} margin={{ top: 10, right: 10, left: 0, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={0} height={40} />
                                            <YAxis tick={{ fontSize: 11 }} width={34} />
                                            <ReTooltip cursor={false} content={({ active, payload, label }) => {
                                                if (!active || !payload) return null; const p = payload[0];
                                                return <div className="bg-white border border-yellow-300 rounded-md shadow-sm p-2 text-[11px]"><div className="text-[10px] text-gray-400 mb-1 font-mono">{label}</div><div className="flex justify-between"><span className="text-gray-500">Лидов</span><span className="font-semibold">{p?.value}</span></div></div>;
                                            }} />
                                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={26} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <CarouselNav />
            </div>

            {/* Bulk Bar */}
            {(selected.size > 0 || selectAllFiltered) && (
                <div className="mb-2 bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-center gap-4 text-[12px] shadow-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                        {selectAllFiltered ? (
                            <>
                                <span className="font-semibold text-gray-800">Выбраны все по фильтрам</span>
                                {loadingFilterSummary ? (
                                    <span className="text-gray-400">Загрузка…</span>
                                ) : filterSummaryError ? (
                                    <span className="text-red-500">{filterSummaryError}</span>
                                ) : (
                                    <>
                                        <span className="px-2 py-1 rounded bg-green-50 text-green-700 font-medium">Реализовано неоплачено: {fmtMoney(filterSummary?.realized_unpaid?.sum || 0)} ₽</span>
                                        <span className="px-2 py-1 rounded bg-green-100 text-green-700">Оплачено: {fmtMoney(filterSummary?.realized_paid?.sum || 0)} ₽</span>
                                        <span className="px-2 py-1 rounded bg-orange-50 text-orange-700">Холд: {fmtMoney(filterSummary?.hold?.sum || 0)} ₽</span>
                                        <span className="text-gray-400">/ к оплате: {filterSummary?.realized_unpaid?.count || 0}</span>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="font-semibold text-gray-800">Выбрано: {selected.size}</span>
                                <span className="text-gray-400">/ к оплате: {bulkStats.eligibleCount}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                        {selectAllFiltered ? null : (
                            <>
                                <span className="px-2 py-1 rounded bg-green-50 text-green-700 font-medium">Реализовано неоплачено: {fmtMoney(bulkStats.realizedUnpaid)} ₽</span>
                                <span className="px-2 py-1 rounded bg-green-100 text-green-700">Оплачено: {fmtMoney(bulkStats.realizedPaid)} ₽</span>
                                <span className="px-2 py-1 rounded bg-orange-50 text-orange-700">Холд: {fmtMoney(bulkStats.hold)} ₽</span>
                            </>
                        )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {selectAllFiltered ? (
                            <button
                                disabled={loadingFilterSummary || (filterSummary?.realized_unpaid?.count || 0) === 0}
                                onClick={handleMarkPaid}
                                className={`px-3 h-8 rounded-md text-[11px] font-medium nav-transition bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed`}
                            >Отметить оплачены {fmtMoney(filterSummary?.realized_unpaid?.sum || 0)} ₽</button>
                        ) : (
                            <button disabled={!bulkStats.eligibleCount} onClick={handleMarkPaid} className={`px-3 h-8 rounded-md text-[11px] font-medium nav-transition bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed`}>Отметить оплачены {fmtMoney(bulkStats.realizedUnpaid)} ₽</button>
                        )}
                        <button onClick={() => { if (selectAllFiltered) { setSelectAllFiltered(false); setFilterSummary(null); setFilterSummaryError(''); setLoadingFilterSummary(false); } setSelected(new Set()); setSelectedMeta(new Map()); }} className="px-3 h-8 rounded-md border border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600 text-[11px] nav-transition">Очистить</button>
                    </div>
                </div>
            )}

            {/* Total count above table */}
            <div className="flex justify-start mb-1">
                <div className="text-[11px] text-gray-500">
                    Всего лидов: <span className="font-mono text-gray-800">{tableTotal}</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-2 py-2 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wide select-none flex items-center">
                    <span className="w-6 flex-shrink-0">
                        <input type="checkbox" checked={selectAllFiltered} onChange={handleToggleSelectAllFiltered} className="rounded border-gray-300" aria-label="Выбрать все по фильтрам" />
                    </span>
                    <button onClick={() => changeSort('created')} className="w-32 text-left hover:text-gray-700">Дата/Время</button>
                    <span className="w-24">ID</span>
                    <span className="w-40">Вебмастер</span>
                    <button onClick={() => changeSort('commission')} className="w-24 text-left hover:text-gray-700">Комиссия</button>
                    <span className="w-20">Город</span>
                    <span className="w-32">Статус</span>
                    <span className="w-40">Поток</span>
                    <span className="w-32">Телефон</span>
                    <span className="w-40">Клиент</span>
                    <span className="w-16">Выпл.</span>
                    <span className="w-28">Дата выплаты</span>
                    <span className="w-28">Оффер</span>
                </div>
                <div className="divide-y divide-gray-100 text-[12px]">
                    {tableLoading ? (
                        <div className="px-2 py-10 text-center text-gray-500 text-[12px]">Загрузка...</div>
                    ) : tableError ? (
                        <div className="px-2 py-10 text-center text-red-500 text-[12px]">{tableError}</div>
                    ) : currentPageItems.length === 0 ? (
                        <div className="px-2 py-10 text-center text-gray-500 text-[12px]">Нет данных</div>
                    ) : currentPageItems.map(l => (
                        <div
                            key={l.id}
                            onClick={() => toggleSelect(l)}
                            className={`px-2 py-2 flex items-center hover:bg-yellow-50/70 cursor-pointer select-none ${selected.has(l.id) ? 'bg-yellow-50' : ''}`}
                            role="row"
                            aria-selected={selected.has(l.id)}
                        >
                            <span className="w-6 flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={selected.has(l.id)}
                                    onClick={e => e.stopPropagation()}
                                    onChange={() => toggleSelect(l)}
                                    className="rounded border-gray-300 cursor-pointer"
                                    aria-label="Select row"
                                />
                            </span>
                            <span className="w-32 font-mono text-gray-500 text-[11px]">{formatDateTime(l.created)}</span>
                            <span className="w-24">
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => handleCopyId(e, l.id)}
                                    title="Скопировать ID"
                                    aria-label={`Скопировать ID ${l.id}`}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-[11px] font-mono text-gray-800 nav-transition"
                                >
                                    <span>{l.id}</span>
                                    {copiedId === String(l.id)
                                        ? <Icon name="Check" size={12} className="text-green-600" />
                                        : <Icon name="Copy" size={12} className="text-gray-400" />}
                                </button>
                            </span>
                            <span className="w-40 text-[11px]">
                                <span className="font-medium text-gray-800">{webmastersById.get(String(l.user_id ?? l.wmId))?.name || l.wmName || '-'}</span>
                                <span className="block text-gray-400 font-mono">{webmastersById.get(String(l.user_id ?? l.wmId))?.id || l.user_id || l.wmId || '-'}</span>
                            </span>
                            <span className="w-24">{commissionCell(l)}</span>
                            <span className="w-20 text-[11px] text-gray-600">{l.city}</span>
                            <span className="w-32">{renderStatusBadge(l.status)}</span>
                            <span className="w-40 pr-2">
                                <div className="text-[11px] font-medium text-gray-800 truncate" title={l.flowName}>{l.flowName}</div>
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                                    <Icon name={sourceIcon(l.sourceType)} size={12} className="opacity-70" />
                                    <span className="truncate">{l.sourceType}</span>
                                </div>
                            </span>
                            <span className="w-32 text-[11px] font-mono text-gray-700 truncate">{l.phone}</span>
                            <span className="w-40 text-[11px] text-gray-700 truncate">{l.clientName}</span>
                            <span className="w-16 flex items-center">{paidIcon(l)}</span>
                            <span className="w-28 text-[11px] text-gray-500 font-mono">{l.paidDate ? formatDateTime(l.paidDate) : '—'}</span>
                            <span className="w-28 text-[11px] text-gray-600">{l.offer}</span>
                        </div>
                    ))}
                </div>
            </div>
            {tableTotal > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
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
                        <div className="flex items-center gap-1 ml-2">
                            {pageItems.map((it, idx) => it === 'left-ellipsis' || it === 'right-ellipsis' ? (
                                <span key={it + idx} className="px-1 text-gray-400">…</span>
                            ) : (
                                <button
                                    key={it}
                                    onClick={() => setPage(it)}
                                    className={`min-w-[34px] h-7 px-2 rounded-md border text-[11px] nav-transition ${page === it ? 'bg-yellow-100 border-yellow-300 text-gray-900 font-medium' : 'border-gray-300 text-gray-600 hover:border-yellow-400 hover:text-yellow-700'}`}
                                >{it}</button>
                            ))}
                        </div>
                        <div className="ml-2 text-gray-500">Стр. <span className="font-mono text-gray-800">{page}</span> / {totalPages}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <select
                            value={pageSize}
                            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                            className="h-7 text-[11px] border border-gray-300 rounded-lg px-3 pr-7 focus:border-yellow-400 focus:outline-none bg-white min-w-[110px] flex items-center leading-none"
                        >
                            {[25,50,100,200].map(size => <option key={size} value={size}>{size} / стр</option>)}
                        </select>
                        <div className="text-gray-500 whitespace-nowrap">Показано {rangeLabel} из {tableTotal}</div>
                    </div>
                </div>
            )}
            {showPayConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowPayConfirm(false)}></div>
                    <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-sm p-5">
                        <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2"><Icon name="Wallet" size={16} />Подтверждение выплаты</h2>
                        <p className="text-[12px] text-gray-600 leading-relaxed mb-3">Отметить оплачены <span className="font-semibold text-gray-800">{selectAllFiltered ? (filterSummary?.realized_unpaid?.count || 0) : bulkStats.eligibleCount}</span> лид(ов). Это действие необратимо в текущем мок-режиме.</p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-[11px] text-yellow-800 mb-4">
                            Будут изменены только реализованные и ещё не оплаченные лиды. Холд и сожжённые не затрагиваются.
                        </div>
                        <div className="flex justify-between items-center gap-2">
                            <div className="text-[11px] text-red-500">{payError}</div>
                            <div className="flex items-center gap-2">
                                <button disabled={isPaying} onClick={() => setShowPayConfirm(false)} className={`px-3 h-8 rounded-md border text-[11px] nav-transition ${isPaying ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>Отмена</button>
                                <button disabled={isPaying} onClick={confirmMarkPaid} className={`px-4 h-8 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[11px] font-medium nav-transition ${isPaying ? 'opacity-60 cursor-wait' : ''}`}>{isPaying ? 'Обработка…' : 'Подтвердить'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStatsPage;
