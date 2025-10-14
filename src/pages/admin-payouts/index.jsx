import React, { useEffect, useMemo, useState } from 'react';
import Icon from 'components/AppIcon';
import http from 'services/http';

// Map backend traffic source to UI label expected by icons
const mapTrafficSourceLabel = (src) => {
  if (!src) return 'Лендинги';
  const s = String(src).toLowerCase();
  if (s.includes('avito') || s.includes('авито')) return 'Avito';
  if (s.includes('янд') || s.includes('директ')) return 'Яндекс.Директ';
  if (s.includes('target') || s.includes('таргет')) return 'Target';
  if (s === 'seo' || s.includes('сео')) return 'SEO';
  if (s.includes('2gis') || s.includes('2 gis') || s.includes('карты')) return 'Карты 2GIS';
  if (s.includes('профи') || s.includes('яндекс услуги') || s.includes('услуги') || s.includes('маркетплейс')) return 'Маркетплейс услуг';
  if (s.includes('телефон')) return 'Телефония';
  if (s.includes('ленд') || s.includes('лендинг')) return 'Лендинги';
  return src;
};

const sourceIcon = (label) => {
  switch (mapTrafficSourceLabel(label)) {
    case 'Avito': return 'AvitoLogo';
    case 'Яндекс.Директ': return 'Search';
    case 'Target': return 'Target';
    case 'SEO': return 'TrendingUp';
    case 'Карты 2GIS': return 'Map';
    case 'Маркетплейс услуг': return 'Store';
    case 'Телефония': return 'Phone';
    case 'Лендинги': return 'Globe';
    default: return 'Circle';
  }
};

const AdminPayoutsPage = () => {
  // Mode: 'webmasters' | 'cities'
  const [mode, setMode] = useState('webmasters');
  // Data sets
  const [wmRows, setWmRows] = useState([]); // unpaid_commissions
  const [cityRows, setCityRows] = useState([]); // unpaid_commissions_by_cities
  // Loading / errors per mode
  const [loadingWm, setLoadingWm] = useState(false);
  const [errorWm, setErrorWm] = useState('');
  const [loadingCity, setLoadingCity] = useState(false);
  const [errorCity, setErrorCity] = useState('');
  // Selection state (keys depend on mode: user_id or city name)
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  // Pay flow state
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  const fetchWebmasters = async (opts = { silent: false }) => {
    if (!opts.silent) setLoadingWm(true);
    setErrorWm('');
    try {
      const { ok, data } = await http.get(`/api/v2/leads/stats/unpaid_commissions`);
      if (ok && Array.isArray(data)) setWmRows(data); else { setWmRows([]); setErrorWm('Не удалось загрузить данные о выплатах (вебмастеры)'); }
    } catch (_) {
      setErrorWm('Ошибка сети при загрузке выплат (вебмастеры)');
    } finally {
      if (!opts.silent) setLoadingWm(false);
    }
  };

  const fetchCities = async (opts = { silent: false }) => {
    if (!opts.silent) setLoadingCity(true);
    setErrorCity('');
    try {
      const { ok, data } = await http.get(`/api/v2/leads/stats/unpaid_commissions_by_cities`);
      if (ok && Array.isArray(data)) {
        const norm = normalizeCityRows(data);
        setCityRows(norm);
        if (import.meta?.env?.MODE !== 'production') console.log('[PAYOUTS][cities] raw:', data, 'normalized:', norm);
      } else { setCityRows([]); setErrorCity('Не удалось загрузить данные по городам'); }
    } catch (_) {
      setErrorCity('Ошибка сети при загрузке по городам');
    } finally {
      if (!opts.silent) setLoadingCity(false);
    }
  };

  // Fetch webmasters grouping once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) fetchWebmasters();
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch city grouping on first switch to cities (lazy)
  // Refetch whenever mode changes (fresh dataset each switch)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (mode === 'webmasters') {
        if (!cancelled) fetchWebmasters();
      } else if (mode === 'cities') {
        if (!cancelled) fetchCities();
      }
    })();
    return () => { cancelled = true; };
  }, [mode]);

  // Safety: if loadingCity stuck > 15s, force stop
  useEffect(() => {
    if (mode !== 'cities' || !loadingCity) return;
    const id = setTimeout(() => { setLoadingCity(false); }, 15000);
    return () => clearTimeout(id);
  }, [mode, loadingCity]);

  // Derived current dataset & meta
  const currentRows = mode === 'webmasters' ? wmRows : cityRows;
  // Normalizer extracted so we can call inside fetchCities
  function normalizeCityRows(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((r, idx) => {
      if (r && typeof r === 'object' && 'city' in r) return r;
      return {
        city: r?.city || 'Нет города',
        users: r?.user ? [r.user] : [],
        sum_to_pay: r?.sum_to_pay || 0,
        leads_count: r?.leads_count || 0,
        threads: r?.threads || [],
        _synthetic: true,
        _index: idx
      };
    });
  }
  const loading = mode === 'webmasters' ? loadingWm : loadingCity;
  const error = mode === 'webmasters' ? errorWm : errorCity;

  const totalToPay = useMemo(() => currentRows.reduce((acc, r) => acc + (Number(r?.sum_to_pay) || 0), 0), [currentRows]);
  const totalGroups = currentRows.length;
  const rowKey = (r) => mode === 'webmasters' ? String(r?.user?.user_id) : String(r?.city || '');

  // Sum of selected groups (their sum_to_pay)
  const selectedTotal = useMemo(() => {
    if (selected.size === 0) return 0;
    const keys = selected;
    return currentRows.reduce((acc, r) => {
      const k = rowKey(r);
      if (keys.has(k)) return acc + (Number(r?.sum_to_pay) || 0);
      return acc;
    }, 0);
  }, [selected, currentRows]);


  const toggleRow = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelected(new Set(currentRows.map(r => rowKey(r))));
    } else {
      setSelected(new Set());
    }
  };

  // Reset selection when switching mode
  useEffect(() => { setSelected(new Set()); setSelectAll(false); }, [mode]);

  // Payment handlers
  const openPayConfirm = () => {
    if (selected.size === 0) return;
    setPayError('');
    setShowPayConfirm(true);
  };

  const performPay = async () => {
    if (selected.size === 0) { setShowPayConfirm(false); return; }
    setIsPaying(true); setPayError(''); setPaySuccess(false);
    try {
      const items = Array.from(selected);
      const body = mode === 'webmasters' ? { users: items } : { cities: items };
      const { ok } = await http.patch('/api/v2/leads/stats/pay_lids', body);
      if (ok) {
        // Refresh dataset for current mode (these rows should disappear as unpaid list shrinks)
        if (mode === 'webmasters') await fetchWebmasters(); else await fetchCities();
        setSelected(new Set()); setSelectAll(false);
        setPaySuccess(true);
        setTimeout(() => setPaySuccess(false), 3500);
      } else {
        setPayError('Не удалось выполнить оплату');
      }
    } catch (_) {
      setPayError('Ошибка при выполнении оплаты');
    } finally {
      setIsPaying(false);
      setShowPayConfirm(false);
    }
  };

  const fmtMoney = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(Number(n || 0)));

  const handleCopyId = async (e, id) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(String(id));
      setCopiedId(String(id));
      setTimeout(() => setCopiedId(prev => (prev === String(id) ? '' : prev)), 2000);
    } catch (_) {
      // fallback: do nothing or maybe show error later
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative p-4">
      {/* Header summary */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Mode toggle */}
        <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden text-[12px]">
          <button
            className={`px-3 h-8 font-medium nav-transition ${mode === 'webmasters' ? 'bg-yellow-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setMode('webmasters')}
          >По вебмастерам</button>
          <button
            className={`px-3 h-8 font-medium nav-transition ${mode === 'cities' ? 'bg-yellow-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setMode('cities')}
          >По городам</button>
        </div>
        <button
          type="button"
          onClick={() => mode === 'webmasters' ? fetchWebmasters() : fetchCities()}
          className="px-3 h-8 rounded-md bg-white border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 nav-transition"
        >Обновить</button>
        <div className="px-3 h-8 rounded-md bg-white border border-gray-200 text-[12px] flex items-center gap-2">
          <Icon name="Wallet" size={16} className="text-yellow-500" />
          <span className="text-gray-600">К выплате:</span>
          <span className="font-semibold text-gray-900">{fmtMoney(totalToPay)} ₽</span>
        </div>
        <div className="px-3 h-8 rounded-md bg-white border border-gray-200 text-[12px] flex items-center gap-2">
          <Icon name="Users" size={16} className="text-gray-500" />
          <span className="text-gray-600">{mode === 'webmasters' ? 'Вебмастеров:' : 'Городов:'}</span>
          <span className="font-semibold text-gray-900">{totalGroups}</span>
        </div>
        {selected.size > 0 && (
          <div className="ml-auto px-3 h-8 rounded-md bg-yellow-100 border border-yellow-300 text-[12px] flex items-center gap-2">
            <Icon name="CheckSquare" size={16} className="text-yellow-700" />
            <span className="text-gray-800">Выбрано: {selected.size}</span>
            <span className="text-gray-500">/ Сумма: <span className="text-gray-900 font-semibold">{fmtMoney(selectedTotal)} ₽</span></span>
            <button
              onClick={openPayConfirm}
              className="ml-2 px-3 h-6 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-medium text-[11px] shadow-sm hover:shadow-md nav-transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPaying || selected.size === 0}
            >{isPaying ? '...' : 'Оплатить выбранные'}</button>
          </div>
        )}
      </div>
      {payError && (
        <div className="mb-3 px-3 py-2 rounded-md border border-red-300 bg-red-50 text-[12px] text-red-700 flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />
          <span>{payError}</span>
          <button onClick={() => setPayError('')} className="ml-auto text-red-600 hover:underline">Закрыть</button>
        </div>
      )}
      {paySuccess && (
        <div className="mb-3 px-3 py-2 rounded-md border border-green-300 bg-green-50 text-[12px] text-green-700 flex items-center gap-2">
          <Icon name="CheckCircle2" size={14} />
          <span>Оплата успешно выполнена</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-2 py-2 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wide select-none flex items-center">
          <span className="w-6 flex-shrink-0">
            <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="rounded border-gray-300" aria-label="Выбрать все" />
          </span>
          {mode === 'webmasters' ? (
            <>
              <span className="w-56">Вебмастер</span>
              <span className="w-28">Лидов</span>
              <span className="w-32">Сумма</span>
              <span className="flex-1">Потоки</span>
              <span className="w-36 text-right pr-2">Действия</span>
            </>
          ) : (
            <>
              <span className="w-48">Город</span>
              <span className="w-32">Вебмастеров</span>
              <span className="w-28">Лидов</span>
              <span className="w-32">Сумма</span>
              <span className="flex-1">Потоки</span>
              <span className="w-36 text-right pr-2">Действия</span>
            </>
          )}
        </div>
        {loading ? (
          <div className="px-2 py-10 text-center text-gray-500 text-[12px]">Загрузка...</div>
        ) : error ? (
          <div className="px-2 py-10 text-center text-red-500 text-[12px]">{error}</div>
        ) : currentRows.length === 0 ? (
          <div className="px-2 py-10 text-center text-gray-500 text-[12px]">Нет данных{mode==='cities' && ' по городам'}</div>
        ) : (
          <div className="divide-y divide-gray-100 text-[12px]">
            {currentRows.map((r) => {
              const key = rowKey(r);
              const isSelected = selected.has(key);
              const threads = Array.isArray(r?.threads) ? r.threads : [];
              const users = mode === 'cities' ? (Array.isArray(r?.users) ? r.users : []) : [];
              return (
                <div
                  key={key}
                  onClick={() => toggleRow(key)}
                  className={`px-2 py-2 flex items-start hover:bg-yellow-50/70 cursor-pointer select-none ${isSelected ? 'bg-yellow-50' : ''}`}
                  role="row"
                  aria-selected={isSelected}
                >
                  <span className="w-6 flex-shrink-0 pt-0.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleRow(key)}
                      className="rounded border-gray-300 cursor-pointer"
                      aria-label="Select row"
                    />
                  </span>
                  {mode === 'webmasters' ? (
                    <>
                      <span className="w-56 text-[12px]">
                        <span className="font-medium text-gray-800 truncate block" title={r?.user?.name || ''}>{r?.user?.name || '-'}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(e, key)}
                          className={`block text-left font-mono text-[11px] nav-transition ${copiedId === key ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'} underline-offset-2 hover:underline`}
                          title={copiedId === key ? 'Скопировано' : 'Скопировать ID'}
                        >ID: {key}{copiedId === key && ' ✓'}</button>
                      </span>
                      <span className="w-28 text-gray-700">{Number(r?.leads_count || 0)}</span>
                      <span className="w-32 font-semibold text-gray-900">{fmtMoney(r?.sum_to_pay)} ₽</span>
                    </>
                  ) : (
                    <>
                      <span className="w-48 text-[12px]">
                        <span className="font-medium text-gray-800 truncate block" title={r?.city || ''}>{r?.city || '—'}</span>
                        {users.length > 0 && (
                          <span className="block text-gray-400 text-[11px] truncate" title={users.map(u=>u.name).join(', ')}>
                            {users.slice(0,3).map(u=>u.name).join(', ')}{users.length>3 ? ` +${users.length-3}`: ''}
                          </span>
                        )}
                      </span>
                      <span className="w-32 text-gray-700">{users.length}</span>
                      <span className="w-28 text-gray-700">{Number(r?.leads_count || 0)}</span>
                      <span className="w-32 font-semibold text-gray-900">{fmtMoney(r?.sum_to_pay)} ₽</span>
                    </>
                  )}
                  <span className="flex-1 pr-2">
                    <div className="flex flex-col gap-1">
                      {threads.map(t => (
                        <div key={String(t.thread_id)} className="flex items-center gap-2 text-[11px] text-gray-600">
                          <Icon name={sourceIcon(t?.traffic_source)} size={12} className="opacity-70" />
                          <span className="truncate" title={t?.title}>{t?.title}</span>
                          <span className="text-gray-400">·</span>
                          <span className="font-mono">{fmtMoney(t?.sum_to_pay)} ₽</span>
                        </div>
                      ))}
                    </div>
                  </span>
                  <span className="w-36 text-right pr-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow(key); openPayConfirm(); }}
                      disabled={isPaying}
                      className="px-2 h-7 rounded-md border border-yellow-400 text-yellow-700 text-[11px] hover:bg-yellow-50 nav-transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Оплатить эту группу"
                    >Оплатить</button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPayConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-sm p-5 flex flex-col gap-4">
            <div className="flex items-start gap-2">
              <Icon name="Wallet" className="text-yellow-500" size={20} />
              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">Подтвердить оплату</h3>
                <p className="text-[12px] text-gray-600 leading-relaxed">
                  Будет выполнена оплата для {selected.size} {mode === 'webmasters' ? 'выбранных вебмастеров' : 'выбранных городов'}. Неоплаченные лиды по этим фильтрам будут помечены как оплаченные. Продолжить?
                </p>
              </div>
            </div>
            {isPaying && <div className="text-[12px] text-gray-500 flex items-center gap-2"><Icon name="Loader2" className="animate-spin" size={14} /> Выполнение...</div>}
            {payError && <div className="text-[12px] text-red-600">{payError}</div>}
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => !isPaying && setShowPayConfirm(false)}
                className="px-3 h-8 rounded-md border border-gray-300 text-[12px] text-gray-700 hover:bg-gray-50 nav-transition disabled:opacity-50"
                disabled={isPaying}
              >Отмена</button>
              <button
                onClick={performPay}
                disabled={isPaying}
                className="px-3 h-8 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-[12px] font-medium shadow-sm hover:shadow-md nav-transition disabled:opacity-50"
              >Подтвердить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayoutsPage;
