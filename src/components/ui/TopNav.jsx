import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { getCurrentUserId, persistUserProfile, getStoredServiceRole } from 'utils/auth';
import { fetchUserProfile } from 'services/users';

// Simple mock aggregated metrics (could be replaced by props / selector later)
const mockMetrics = {
    earnings: 124580,
    hold: 7450,
    leads: 156
};

const formatNumber = (n) => new Intl.NumberFormat('ru-RU').format(n);

const TopNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [serviceRoleState, setServiceRoleState] = useState(() => getStoredServiceRole());
    const fetchedOnceRef = useRef(false);

    // Determine service role from storage, kept in state to react to changes
    const serviceRole = serviceRoleState || 'default';
    const navItems = [
        { label: 'Дашборд', path: '/dashboard' },
        { label: 'Потоки', path: '/threads' },
        { label: 'Лиды', path: '/leads' },
        ...(serviceRole === 'admin'
            ? [
                { label: 'Статистика', path: '/admin/stats' },
                { label: 'Выплаты', path: '/admin/payouts' },
                { label: 'Настройки выплат', path: '/rates-settings' },
              ]
            : [])
    ];

    // On mount: if we appear to have auth cookies, try to fetch current user once and persist
    useEffect(() => {
        if (fetchedOnceRef.current) return;
        fetchedOnceRef.current = true;
        // We don't know the ID yet — read from LS or fall back to '00000'
        const id = getCurrentUserId();
        const effectiveId = id ? id : '00000';
        (async () => {
            try {
                const user = await fetchUserProfile(effectiveId, { navigate });
                if (user && user.id) {
                    persistUserProfile(user);
                    setServiceRoleState(user.service_role || 'default');
                }
            } catch (_) {
                // Silently ignore (unauthorized or network) — TopNav will still render
            }
        })();
    }, [navigate]);

    const isActive = (path) => location.pathname === path;

    return (
        <header className="fixed top-0 left-0 right-0 h-14 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md shadow-sm nav-transition">
            <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
                {/* Left: Logo + Nav */}
                <div className="flex items-center gap-6">
                    {/* Brand */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="relative flex items-center h-8 group select-none"
                        aria-label="Leadmaker home"
                    >
                        <span className="font-heading font-semibold text-[18px] leading-none tracking-tight text-gray-900 transition-colors group-hover:text-gray-900">Leadmaker</span>
                        <span className="text-yellow-500 text-[18px] leading-none ml-[1px]">.</span>
                        {/* Partial underline */}
                        <span className="pointer-events-none absolute left-0 -bottom-1 h-[2px] w-10 bg-yellow-400 rounded-full transition-all duration-300 ease-out group-hover:w-16 group-hover:bg-yellow-500" />
                    </button>
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map(item => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`px-3 py-2 rounded-md text-sm font-medium nav-transition relative overflow-hidden
                  ${isActive(item.path)
                                    ? 'text-gray-900 bg-yellow-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
                `}
                            >
                                {item.label}
                                <span className={`absolute left-3 right-3 bottom-1 h-[2px] rounded-full transition-all duration-300
                                    ${isActive(item.path) ? 'bg-yellow-500' : 'bg-transparent group-hover:bg-yellow-300'}
                                `} />
                            </button>
                        ))}
                    </nav>
                </div>
                {/* Right: Metrics + Profile */}
                <div className="flex items-center gap-4">
                    
                    <div className="relative">
                        <button
                            onClick={() => navigate('/profile-management')}
                            aria-label="Открыть профиль"
                            className="group flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-yellow-400 hover:shadow-md nav-transition focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                        >
                            {/* Avatar with gradient ring */}
                            <div className="relative w-8 h-8 rounded-full p-[1px] bg-gradient-to-br from-yellow-400 to-yellow-500">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                    <Icon name="User" size={14} className="text-gray-700" />
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-gray-800 hidden sm:inline">Профиль</span>
                            <Icon name="ChevronRight" size={14} className="hidden sm:inline text-gray-400 group-hover:text-gray-600 nav-transition" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNav;
