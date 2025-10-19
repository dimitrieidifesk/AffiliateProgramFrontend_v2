import React, { useEffect, useMemo, useState } from 'react';
import Icon from 'components/AppIcon';
import http from 'services/http';
import AddCityModal from './components/AddCityModal';
import EditCityModal from './components/EditCityModal';
import DeleteCityModal from './components/DeleteCityModal';
import { AddRegionModal, EditRegionModal, DeleteRegionModal } from './components/RegionModals';
import AddUserRateModal from './components/AddUserRateModal';
import { EditUserRateModal, DeleteUserRateModal } from './components/UserRateModals';

// Rates Settings Page (Commission & Rates Management)
// Large table with cities/regions/user rates grouping
// Each city row can have nested user_rates overrides

const RatesSettingsPage = () => {
    // Temporary role guard (to be replaced with real auth context)
    const userRole = 'admin';
    const [groupMode, setGroupMode] = useState('cities'); // 'cities' | 'regions' | 'users'
    const [searchQuery, setSearchQuery] = useState('');
    
    // Offers list and selected offer
    const [offersList, setOffersList] = useState([]);
    const [loadingOffers, setLoadingOffers] = useState(false);
    const [selectedOfferId, setSelectedOfferId] = useState(null);
    
    const [citiesList, setCitiesList] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [citiesError, setCitiesError] = useState('');
    const [regionsList, setRegionsList] = useState([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [regionsError, setRegionsError] = useState('');

    // Pagination for cities
    const [citiesPagination, setCitiesPagination] = useState({ total: 0, limit: 50, offset: 0, page: 1, pages: 1 });
    const [citiesPage, setCitiesPage] = useState(1);

    // Pagination for regions
    const [regionsPagination, setRegionsPagination] = useState({ total: 0, limit: 50, offset: 0, page: 1, pages: 1 });
    const [regionsPage, setRegionsPage] = useState(1);

    // User rates list
    const [userRatesList, setUserRatesList] = useState([]);
    const [loadingUserRates, setLoadingUserRates] = useState(false);
    const [userRatesError, setUserRatesError] = useState('');
    // Pagination for user rates
    const [userRatesPagination, setUserRatesPagination] = useState({ total: 0, limit: 50, offset: 0, page: 1, pages: 1 });
    const [userRatesPage, setUserRatesPage] = useState(1);
    // Users list for dropdown
    const [usersList, setUsersList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Add city modal
    const [showAddCityModal, setShowAddCityModal] = useState(false);
    const [newCity, setNewCity] = useState({ city: '', region_id: '', commission: '' });
    const [savingCity, setSavingCity] = useState(false);
    const [cityError, setCityError] = useState('');
    // Edit city modal
    const [showEditCityModal, setShowEditCityModal] = useState(false);
    const [editingCity, setEditingCity] = useState(null); // { city_id, city, region_id, commission }
    const [savingEditCity, setSavingEditCity] = useState(false);
    const [editCityError, setEditCityError] = useState('');
    // Delete city confirmation
    const [showDeleteCityModal, setShowDeleteCityModal] = useState(false);
    const [deletingCity, setDeletingCity] = useState(null); // city object
    const [deletingCityInProgress, setDeletingCityInProgress] = useState(false);

    // Add region modal
    const [showAddRegionModal, setShowAddRegionModal] = useState(false);
    const [newRegion, setNewRegion] = useState({ region_title: '', base_comission: '', rate: '1' });
    const [savingRegion, setSavingRegion] = useState(false);
    const [regionError, setRegionError] = useState('');
    // Edit region modal
    const [showEditRegionModal, setShowEditRegionModal] = useState(false);
    const [editingRegion, setEditingRegion] = useState(null); // { region_id, region_title, base_comission, rate }
    const [savingEditRegion, setSavingEditRegion] = useState(false);
    const [editRegionError, setEditRegionError] = useState('');
    // Delete region confirmation
    const [showDeleteRegionModal, setShowDeleteRegionModal] = useState(false);
    const [deletingRegion, setDeletingRegion] = useState(null); // region object
    const [deletingRegionInProgress, setDeletingRegionInProgress] = useState(false);

    // Add user rate modal
    const [showAddUserRateModal, setShowAddUserRateModal] = useState(false);
    const [newUserRate, setNewUserRate] = useState({
        user_id: '',
        city_id: '',
        region_id: '',
        rate: '',
        override_commission: '',
        end_date: '',
        end_orders_count: ''
    });
    const [savingUserRate, setSavingUserRate] = useState(false);
    const [userRateError, setUserRateError] = useState('');
    const [commissionType, setCommissionType] = useState('rate'); // 'rate' | 'override'
    // Edit user rate modal
    const [showEditUserRateModal, setShowEditUserRateModal] = useState(false);
    const [editingUserRate, setEditingUserRate] = useState(null);
    const [savingEditUserRate, setSavingEditUserRate] = useState(false);
    const [editUserRateError, setEditUserRateError] = useState('');
    const [editCommissionType, setEditCommissionType] = useState('rate'); // 'rate' | 'override'
    // Delete user rate confirmation
    const [showDeleteUserRateModal, setShowDeleteUserRateModal] = useState(false);
    const [deletingUserRate, setDeletingUserRate] = useState(null);
    const [deletingUserRateInProgress, setDeletingUserRateInProgress] = useState(false);

    // Fetch offers list on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingOffers(true);
            try {
                const { ok, data } = await http.get('/api/v2/offers/');
                if (cancelled) return;
                if (ok && data && Array.isArray(data.items)) {
                    setOffersList(data.items);
                    // Select first offer by default
                    if (data.items.length > 0 && !selectedOfferId) {
                        setSelectedOfferId(data.items[0].offer_id);
                    }
                }
            } catch (e) {
                // Silent fail - show empty list
            } finally {
                if (!cancelled) setLoadingOffers(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Fetch cities list
    useEffect(() => {
        // Only fetch when groupMode is 'cities'
        if (groupMode !== 'cities' || !selectedOfferId) return;

        let cancelled = false;
        (async () => {
            setLoadingCities(true);
            setCitiesError('');
            try {
                const offset = (citiesPage - 1) * citiesPagination.limit;
                const queryParam = searchQuery.trim() ? `&query=${encodeURIComponent(searchQuery.trim())}` : '';
                const path = `/api/v2/rates/list_cities?offer_id=${selectedOfferId}&limit=${citiesPagination.limit}&offset=${offset}${queryParam}`;
                const { ok, data } = await http.get(path);
                if (cancelled) return;
                if (ok && data && Array.isArray(data.items)) {
                    setCitiesList(data.items);
                    if (data.pagination) {
                        setCitiesPagination(data.pagination);
                    }
                } else {
                    setCitiesList([]);
                }
            } catch (e) {
                if (!cancelled) {
                    setCitiesError('Не удалось загрузить список городов');
                    setCitiesList([]);
                }
            } finally {
                if (!cancelled) setLoadingCities(false);
            }
        })();
        return () => { cancelled = true; };
    }, [groupMode, selectedOfferId, citiesPage, citiesPagination.limit, searchQuery]);

    // Fetch regions list
    useEffect(() => {
        // Only fetch when groupMode is 'regions'
        if (groupMode !== 'regions' || !selectedOfferId) return;

        let cancelled = false;
        (async () => {
            setLoadingRegions(true);
            setRegionsError('');
            try {
                const offset = (regionsPage - 1) * regionsPagination.limit;
                const queryParam = searchQuery.trim() ? `&query=${encodeURIComponent(searchQuery.trim())}` : '';
                const path = `/api/v2/rates/list_regions?offer_id=${selectedOfferId}&limit=${regionsPagination.limit}&offset=${offset}${queryParam}`;
                const { ok, data } = await http.get(path);
                if (cancelled) return;
                if (ok && data && Array.isArray(data.items)) {
                    setRegionsList(data.items);
                    if (data.pagination) {
                        setRegionsPagination(data.pagination);
                    }
                } else {
                    setRegionsList([]);
                }
            } catch (e) {
                if (!cancelled) {
                    setRegionsError('Не удалось загрузить список регионов');
                    setRegionsList([]);
                }
            } finally {
                if (!cancelled) setLoadingRegions(false);
            }
        })();
        return () => { cancelled = true; };
    }, [groupMode, selectedOfferId, regionsPage, regionsPagination.limit, searchQuery]);

    // Reset data when offer changes (except initial load)
    useEffect(() => {
        if (!selectedOfferId) return; // Skip during initial load
        
        // Reset pagination and data
        setCitiesList([]);
        setRegionsList([]);
        setUserRatesList([]);
        setCitiesPage(1);
        setRegionsPage(1);
        setUserRatesPage(1);
    }, [selectedOfferId]);

    // Fetch user rates list
    useEffect(() => {
        // Only fetch when groupMode is 'users' and we have an offer selected
        if (groupMode !== 'users' || !selectedOfferId) return;

        let cancelled = false;
        (async () => {
            setLoadingUserRates(true);
            setUserRatesError('');
            try {
                const offset = (userRatesPage - 1) * userRatesPagination.limit;
                const resp = await http.get(`/api/v2/rates/list_rates?offer_id=${selectedOfferId}&limit=${userRatesPagination.limit}&offset=${offset}`);
                if (!cancelled) {
                    if (resp.ok && resp.data) {
                        setUserRatesList(resp.data.items || []);
                        if (resp.data.pagination) {
                            const { total, limit, offset, page, pages } = resp.data.pagination;
                            setUserRatesPagination({ total, limit, offset, page, pages });
                        }
                    } else {
                        setUserRatesError('Не удалось загрузить список тарифов');
                        setUserRatesList([]);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    setUserRatesError('Не удалось загрузить список тарифов');
                    setUserRatesList([]);
                }
            } finally {
                if (!cancelled) setLoadingUserRates(false);
            }
        })();
        return () => { cancelled = true; };
    }, [groupMode, selectedOfferId, userRatesPage, userRatesPagination.limit]);

    // Fetch users list for dropdown
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingUsers(true);
            try {
                const resp = await http.get('/api/v2/users/?limit=500');
                if (!cancelled && resp.ok && resp.data) {
                    setUsersList(resp.data.items || []);
                }
            } catch (e) {
                if (!cancelled) {
                    setUsersList([]);
                }
            } finally {
                if (!cancelled) setLoadingUsers(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Preload cities and regions for user rate modals
    useEffect(() => {
        if (groupMode !== 'users' || !selectedOfferId) return;

        // Load cities if not loaded (simpler endpoint without nested data)
        if (citiesList.length === 0) {
            (async () => {
                try {
                    const { ok, data } = await http.get(`/api/v2/rates/cities?offer_id=${selectedOfferId}`);
                    if (ok && Array.isArray(data)) {
                        // Convert to format compatible with existing code
                        const formattedCities = data.map(city => ({ city }));
                        setCitiesList(formattedCities);
                    }
                } catch (e) {
                    // Silent fail
                }
            })();
        }

        // Load regions if not loaded (simpler endpoint)
        if (regionsList.length === 0) {
            (async () => {
                try {
                    const { ok, data } = await http.get(`/api/v2/rates/regions?offer_id=${selectedOfferId}`);
                    if (ok && Array.isArray(data)) {
                        // Convert to format compatible with existing code
                        const formattedRegions = data.map(region => ({ region }));
                        setRegionsList(formattedRegions);
                    }
                } catch (e) {
                    // Silent fail
                }
            })();
        }
    }, [groupMode, citiesList.length, regionsList.length, selectedOfferId]);

    const fmtMoney = (n) => new Intl.NumberFormat('ru-RU').format(n);

    // Create lookup maps for cities and regions
    const citiesMap = useMemo(() => {
        const map = new Map();
        citiesList.forEach(item => {
            const city = item?.city;
            if (city?.city_id) {
                map.set(city.city_id, city.city || `Город #${city.city_id}`);
            }
        });
        return map;
    }, [citiesList]);

    const regionsMap = useMemo(() => {
        const map = new Map();
        regionsList.forEach(item => {
            const region = item?.region;
            if (region?.region_id) {
                map.set(region.region_id, region.region_title || `Регион #${region.region_id}`);
            }
        });
        return map;
    }, [regionsList]);

    // Filtered cities by search
    const filteredCities = useMemo(() => {
        if (!searchQuery.trim()) return citiesList;
        const q = searchQuery.toLowerCase();
        return citiesList.filter(item => {
            const cityName = item?.city?.city || '';
            const regionName = item?.region?.region_title || '';
            return cityName.toLowerCase().includes(q) || regionName.toLowerCase().includes(q);
        });
    }, [citiesList, searchQuery]);

    // Filtered regions by search
    const filteredRegions = useMemo(() => {
        if (!searchQuery.trim()) return regionsList;
        const q = searchQuery.toLowerCase();
        return regionsList.filter(item => {
            const regionName = item?.region?.region_title || '';
            return regionName.toLowerCase().includes(q);
        });
    }, [regionsList, searchQuery]);

    // Check if city already exists (for add modal)
    const cityExists = useMemo(() => {
        if (!newCity.city.trim()) return false;
        const cityNameLower = newCity.city.trim().toLowerCase();
        return citiesList.some(item => {
            const existingCityName = (item?.city?.city || '').toLowerCase();
            return existingCityName === cityNameLower;
        });
    }, [newCity.city, citiesList]);

    // Check if edited city name already exists (excluding current city)
    const editedCityExists = useMemo(() => {
        if (!editingCity || !editingCity.city.trim()) return false;
        const cityNameLower = editingCity.city.trim().toLowerCase();
        return citiesList.some(item => {
            const existingCityName = (item?.city?.city || '').toLowerCase();
            const existingCityId = item?.city?.city_id;
            // Exclude current city being edited
            return existingCityName === cityNameLower && existingCityId !== editingCity.city_id;
        });
    }, [editingCity, citiesList]);

    // Check if region already exists (for add modal)
    const regionExists = useMemo(() => {
        if (!newRegion.region_title.trim()) return false;
        const regionNameLower = newRegion.region_title.trim().toLowerCase();
        return regionsList.some(item => {
            const existingRegionName = (item?.region?.region_title || '').toLowerCase();
            return existingRegionName === regionNameLower;
        });
    }, [newRegion.region_title, regionsList]);

    // Check if edited region name already exists (excluding current region)
    const editedRegionExists = useMemo(() => {
        if (!editingRegion || !editingRegion.region_title.trim()) return false;
        const regionNameLower = editingRegion.region_title.trim().toLowerCase();
        return regionsList.some(item => {
            const existingRegionName = (item?.region?.region_title || '').toLowerCase();
            const existingRegionId = item?.region?.region_id;
            // Exclude current region being edited
            return existingRegionName === regionNameLower && existingRegionId !== editingRegion.region_id;
        });
    }, [editingRegion, regionsList]);

    const handleAddCity = async () => {
        setCityError('');
        // Validation
        if (!newCity.city.trim()) {
            setCityError('Название города обязательно');
            return;
        }
        if (!newCity.commission || Number(newCity.commission) < 0) {
            setCityError('Укажите корректную комиссию');
            return;
        }
        // Check for duplicates
        if (cityExists) {
            setCityError(`Город "${newCity.city.trim()}" уже существует в списке`);
            return;
        }
        setSavingCity(true);
        try {
            const payload = {
                city: newCity.city.trim(),
                region_id: newCity.region_id ? Number(newCity.region_id) : null,
                offer_id: selectedOfferId,
                commission: Number(newCity.commission)
            };
            const { ok, data } = await http.post('/api/v2/rates/cities', payload);
            if (ok) {
                // Refetch cities list
                const offset = (citiesPage - 1) * citiesPagination.limit;
                const queryParam = searchQuery.trim() ? `&query=${encodeURIComponent(searchQuery.trim())}` : '';
                const pathRefresh = `/api/v2/rates/list_cities?offer_id=${selectedOfferId}&limit=${citiesPagination.limit}&offset=${offset}${queryParam}`;
                const { ok: okRefresh, data: refreshData } = await http.get(pathRefresh);
                if (okRefresh && refreshData && Array.isArray(refreshData.items)) {
                    setCitiesList(refreshData.items);
                    if (refreshData.pagination) {
                        setCitiesPagination(refreshData.pagination);
                    }
                }
                // Close modal and reset form
                setShowAddCityModal(false);
                setNewCity({ city: '', region_id: '', commission: '' });
            } else {
                // Handle server error with detail message
                const errorDetail = data?.detail || '';
                if (errorDetail.includes('already exists')) {
                    const match = errorDetail.match(/City '(.+?)' already exists/);
                    const cityName = match ? match[1] : newCity.city.trim();
                    setCityError(`Город "${cityName}" уже существует для этого оффера`);
                } else {
                    setCityError('Не удалось добавить город');
                }
            }
        } catch (e) {
            setCityError('Произошла ошибка при сохранении');
        } finally {
            setSavingCity(false);
        }
    };

    const handleEditCity = async () => {
        setEditCityError('');
        // Validation
        if (!editingCity.city.trim()) {
            setEditCityError('Название города обязательно');
            return;
        }
        if (!editingCity.commission || Number(editingCity.commission) < 0) {
            setEditCityError('Укажите корректную комиссию');
            return;
        }
        // Check for duplicates
        if (editedCityExists) {
            setEditCityError(`Город "${editingCity.city.trim()}" уже существует в списке`);
            return;
        }
        setSavingEditCity(true);
        try {
            const payload = {
                city: editingCity.city.trim(),
                region_id: editingCity.region_id ? Number(editingCity.region_id) : null,
                commission: Number(editingCity.commission)
            };
            const { ok, data } = await http.patch(`/api/v2/rates/cities/${editingCity.city_id}`, payload);
            if (ok) {
                // Refetch cities list
                const offset = (citiesPage - 1) * citiesPagination.limit;
                const queryParam = searchQuery.trim() ? `&query=${encodeURIComponent(searchQuery.trim())}` : '';
                const pathRefresh = `/api/v2/rates/list_cities?offer_id=${selectedOfferId}&limit=${citiesPagination.limit}&offset=${offset}${queryParam}`;
                const { ok: okRefresh, data: refreshData } = await http.get(pathRefresh);
                if (okRefresh && refreshData && Array.isArray(refreshData.items)) {
                    setCitiesList(refreshData.items);
                    if (refreshData.pagination) {
                        setCitiesPagination(refreshData.pagination);
                    }
                }
                // Close modal
                setShowEditCityModal(false);
                setEditingCity(null);
            } else {
                // Handle server error with detail message
                const errorDetail = data?.detail || '';
                if (errorDetail.includes('already exists')) {
                    const match = errorDetail.match(/City '(.+?)' already exists/);
                    const cityName = match ? match[1] : editingCity.city.trim();
                    setEditCityError(`Город "${cityName}" уже существует для этого оффера`);
                } else {
                    setEditCityError('Не удалось обновить город');
                }
            }
        } catch (e) {
            setEditCityError('Произошла ошибка при сохранении');
        } finally {
            setSavingEditCity(false);
        }
    };

    const handleDeleteCity = async () => {
        if (!deletingCity) return;
        setDeletingCityInProgress(true);
        try {
            const { ok } = await http.delete(`/api/v2/rates/cities/${deletingCity.city_id}`);
            if (ok) {
                // Refetch cities list
                const offset = (citiesPage - 1) * citiesPagination.limit;
                const queryParam = searchQuery.trim() ? `&query=${encodeURIComponent(searchQuery.trim())}` : '';
                const pathRefresh = `/api/v2/rates/list_cities?offer_id=${selectedOfferId}&limit=${citiesPagination.limit}&offset=${offset}${queryParam}`;
                const { ok: okRefresh, data } = await http.get(pathRefresh);
                if (okRefresh && data && Array.isArray(data.items)) {
                    setCitiesList(data.items);
                    if (data.pagination) {
                        setCitiesPagination(data.pagination);
                    }
                }
                // Close modal
                setShowDeleteCityModal(false);
                setDeletingCity(null);
            } else {
                alert('Не удалось удалить город');
            }
        } catch (e) {
            alert('Произошла ошибка при удалении');
        } finally {
            setDeletingCityInProgress(false);
        }
    };

    const openEditCityModal = (item) => {
        const city = item?.city;
        const region = item?.region;
        setEditingCity({
            city_id: city?.city_id,
            city: city?.city || '',
            region_id: region?.region_id || '',
            commission: city?.commission || ''
        });
        setEditCityError('');
        setShowEditCityModal(true);
    };

    const openDeleteCityModal = (item) => {
        setDeletingCity(item?.city);
        setShowDeleteCityModal(true);
    };

    const handleAddRegion = async () => {
        setRegionError('');
        // Validation
        if (!newRegion.region_title.trim()) {
            setRegionError('Название региона обязательно');
            return;
        }
        if (!newRegion.base_comission || Number(newRegion.base_comission) < 0) {
            setRegionError('Укажите корректную базовую комиссию');
            return;
        }
        if (!newRegion.rate || Number(newRegion.rate) <= 0) {
            setRegionError('Укажите корректный рейт (больше 0)');
            return;
        }
        // Check for duplicates
        if (regionExists) {
            setRegionError(`Регион "${newRegion.region_title.trim()}" уже существует в списке`);
            return;
        }
        setSavingRegion(true);
        try {
            const payload = {
                region_title: newRegion.region_title.trim(),
                base_comission: Number(newRegion.base_comission),
                rate: Number(newRegion.rate),
                offer_id: selectedOfferId
            };
            const { ok, data } = await http.post('/api/v2/rates/regions', payload);
            if (ok) {
                // Refetch regions list
                const offset = (regionsPage - 1) * regionsPagination.limit;
                const queryParam = searchQuery.trim() ? `&query=${encodeURIComponent(searchQuery.trim())}` : '';
                const pathRefresh = `/api/v2/rates/list_regions?offer_id=${selectedOfferId}&limit=${regionsPagination.limit}&offset=${offset}${queryParam}`;
                const { ok: okRefresh, data: refreshData } = await http.get(pathRefresh);
                if (okRefresh && refreshData && Array.isArray(refreshData.items)) {
                    setRegionsList(refreshData.items);
                    if (refreshData.pagination) {
                        setRegionsPagination(refreshData.pagination);
                    }
                }
                // Close modal and reset form
                setShowAddRegionModal(false);
                setNewRegion({ region_title: '', base_comission: '', rate: '1' });
            } else {
                // Handle server error with detail message
                const errorDetail = data?.detail || '';
                if (errorDetail.includes('already exists')) {
                    const match = errorDetail.match(/Region '(.+?)' already exists/);
                    const regionName = match ? match[1] : newRegion.region_title.trim();
                    setRegionError(`Регион "${regionName}" уже существует для этого оффера`);
                } else {
                    setRegionError('Не удалось добавить регион');
                }
            }
        } catch (e) {
            setRegionError('Произошла ошибка при сохранении');
        } finally {
            setSavingRegion(false);
        }
    };

    const handleEditRegion = async () => {
        setEditRegionError('');
        // Validation
        if (!editingRegion.region_title.trim()) {
            setEditRegionError('Название региона обязательно');
            return;
        }
        if (!editingRegion.base_comission || Number(editingRegion.base_comission) < 0) {
            setEditRegionError('Укажите корректную базовую комиссию');
            return;
        }
        if (!editingRegion.rate || Number(editingRegion.rate) <= 0) {
            setEditRegionError('Укажите корректный рейт (больше 0)');
            return;
        }
        // Check for duplicates
        if (editedRegionExists) {
            setEditRegionError(`Регион "${editingRegion.region_title.trim()}" уже существует в списке`);
            return;
        }
        setSavingEditRegion(true);
        try {
            const payload = {
                region_title: editingRegion.region_title.trim(),
                base_comission: Number(editingRegion.base_comission),
                rate: Number(editingRegion.rate)
            };
            const { ok, data } = await http.patch(`/api/v2/rates/regions/${editingRegion.region_id}`, payload);
            if (ok) {
                // Refetch regions list
                const offset = (regionsPage - 1) * regionsPagination.limit;
                const queryParam = searchQuery.trim() ? `&query=${encodeURIComponent(searchQuery.trim())}` : '';
                const pathRefresh = `/api/v2/rates/list_regions?offer_id=${selectedOfferId}&limit=${regionsPagination.limit}&offset=${offset}${queryParam}`;
                const { ok: okRefresh, data: refreshData } = await http.get(pathRefresh);
                if (okRefresh && refreshData && Array.isArray(refreshData.items)) {
                    setRegionsList(refreshData.items);
                    if (refreshData.pagination) {
                        setRegionsPagination(refreshData.pagination);
                    }
                }
                // Close modal
                setShowEditRegionModal(false);
                setEditingRegion(null);
            } else {
                // Handle server error with detail message
                const errorDetail = data?.detail || '';
                if (errorDetail.includes('already exists')) {
                    const match = errorDetail.match(/Region '(.+?)' already exists/);
                    const regionName = match ? match[1] : editingRegion.region_title.trim();
                    setEditRegionError(`Регион "${regionName}" уже существует для этого оффера`);
                } else {
                    setEditRegionError('Не удалось обновить регион');
                }
            }
        } catch (e) {
            setEditRegionError('Произошла ошибка при сохранении');
        } finally {
            setSavingEditRegion(false);
        }
    };

    const handleDeleteRegion = async () => {
        if (!deletingRegion) return;
        setDeletingRegionInProgress(true);
        try {
            const { ok } = await http.delete(`/api/v2/rates/regions/${deletingRegion.region_id}`);
            if (ok) {
                // Refetch regions list
                const offset = (regionsPage - 1) * regionsPagination.limit;
                const queryParam = searchQuery.trim() ? `&query=${encodeURIComponent(searchQuery.trim())}` : '';
                const pathRefresh = `/api/v2/rates/list_regions?offer_id=${selectedOfferId}&limit=${regionsPagination.limit}&offset=${offset}${queryParam}`;
                const { ok: okRefresh, data } = await http.get(pathRefresh);
                if (okRefresh && data && Array.isArray(data.items)) {
                    setRegionsList(data.items);
                    if (data.pagination) {
                        setRegionsPagination(data.pagination);
                    }
                }
                // Close modal
                setShowDeleteRegionModal(false);
                setDeletingRegion(null);
            } else {
                alert('Не удалось удалить регион');
            }
        } catch (e) {
            alert('Произошла ошибка при удалении');
        } finally {
            setDeletingRegionInProgress(false);
        }
    };

    const openEditRegionModal = (item) => {
        const region = item?.region;
        setEditingRegion({
            region_id: region?.region_id,
            region_title: region?.region_title || '',
            base_comission: region?.base_comission || '',
            rate: region?.rate || '1'
        });
        setEditRegionError('');
        setShowEditRegionModal(true);
    };

    const openDeleteRegionModal = (item) => {
        setDeletingRegion(item?.region);
        setShowDeleteRegionModal(true);
    };

    // ==================== User Rates Handlers ====================
    const handleAddUserRate = async () => {
        setUserRateError('');
        // Validation
        if (!newUserRate.user_id) {
            setUserRateError('Укажите пользователя');
            return;
        }
        if (!newUserRate.city_id && !newUserRate.region_id) {
            setUserRateError('Укажите город или регион');
            return;
        }
        if (newUserRate.city_id && newUserRate.region_id) {
            setUserRateError('Укажите либо город, либо регион (не оба)');
            return;
        }

        setSavingUserRate(true);
        try {
            const payload = {
                user_id: parseInt(newUserRate.user_id, 10),
                offer_id: selectedOfferId
            };
            if (newUserRate.city_id) payload.city_id = parseInt(newUserRate.city_id, 10);
            if (newUserRate.region_id) payload.region_id = parseInt(newUserRate.region_id, 10);
            if (newUserRate.rate) payload.rate = parseFloat(newUserRate.rate);
            if (newUserRate.override_commission) payload.override_commission = parseFloat(newUserRate.override_commission);
            if (newUserRate.end_date) payload.end_date = newUserRate.end_date;
            if (newUserRate.end_orders_count) payload.end_orders_count = parseInt(newUserRate.end_orders_count, 10);

            const { ok, data } = await http.post('/api/v2/rates/rates', payload);
            if (ok) {
                // Refetch user rates list
                const offset = (userRatesPage - 1) * userRatesPagination.limit;
                const pathRefresh = `/api/v2/rates/list_rates?offer_id=${selectedOfferId}&limit=${userRatesPagination.limit}&offset=${offset}`;
                const { ok: okRefresh, data: dataRefresh } = await http.get(pathRefresh);
                if (okRefresh && dataRefresh && Array.isArray(dataRefresh.items)) {
                    setUserRatesList(dataRefresh.items);
                    if (dataRefresh.pagination) {
                        setUserRatesPagination(dataRefresh.pagination);
                    }
                }
                // Close modal and reset
                setShowAddUserRateModal(false);
                setNewUserRate({ user_id: '', city_id: '', region_id: '', rate: '', override_commission: '', end_date: '', end_orders_count: '' });
            } else {
                setUserRateError(data?.detail || 'Не удалось добавить тариф');
            }
        } catch (e) {
            setUserRateError('Произошла ошибка при добавлении тарифа');
        } finally {
            setSavingUserRate(false);
        }
    };

    const handleEditUserRate = async () => {
        setEditUserRateError('');
        if (!editingUserRate) return;
        // Validation
        if (!editingUserRate.user_id) {
            setEditUserRateError('Укажите пользователя');
            return;
        }
        if (!editingUserRate.city_id && !editingUserRate.region_id) {
            setEditUserRateError('Укажите город или регион');
            return;
        }
        if (editingUserRate.city_id && editingUserRate.region_id) {
            setEditUserRateError('Укажите либо город, либо регион (не оба)');
            return;
        }

        setSavingEditUserRate(true);
        try {
            const payload = {
                user_id: parseInt(editingUserRate.user_id, 10),
                offer_id: selectedOfferId
            };
            if (editingUserRate.city_id) payload.city_id = parseInt(editingUserRate.city_id, 10);
            if (editingUserRate.region_id) payload.region_id = parseInt(editingUserRate.region_id, 10);
            if (editingUserRate.rate) payload.rate = parseFloat(editingUserRate.rate);
            if (editingUserRate.override_commission) payload.override_commission = parseFloat(editingUserRate.override_commission);
            if (editingUserRate.end_date) payload.end_date = editingUserRate.end_date;
            if (editingUserRate.end_orders_count) payload.end_orders_count = parseInt(editingUserRate.end_orders_count, 10);

            const { ok, data } = await http.patch(`/api/v2/rates/rates/${editingUserRate.id}`, payload);
            if (ok) {
                // Refetch user rates list
                const offset = (userRatesPage - 1) * userRatesPagination.limit;
                const pathRefresh = `/api/v2/rates/list_rates?offer_id=${selectedOfferId}&limit=${userRatesPagination.limit}&offset=${offset}`;
                const { ok: okRefresh, data: dataRefresh } = await http.get(pathRefresh);
                if (okRefresh && dataRefresh && Array.isArray(dataRefresh.items)) {
                    setUserRatesList(dataRefresh.items);
                    if (dataRefresh.pagination) {
                        setUserRatesPagination(dataRefresh.pagination);
                    }
                }
                // Close modal
                setShowEditUserRateModal(false);
                setEditingUserRate(null);
            } else {
                setEditUserRateError(data?.detail || 'Не удалось изменить тариф');
            }
        } catch (e) {
            setEditUserRateError('Произошла ошибка при сохранении');
        } finally {
            setSavingEditUserRate(false);
        }
    };

    const handleDeleteUserRate = async () => {
        if (!deletingUserRate) return;
        setDeletingUserRateInProgress(true);
        try {
            const { ok } = await http.delete(`/api/v2/rates/rates/${deletingUserRate.id}`);
            if (ok) {
                // Refetch user rates list
                const offset = (userRatesPage - 1) * userRatesPagination.limit;
                const pathRefresh = `/api/v2/rates/list_rates?offer_id=${selectedOfferId}&limit=${userRatesPagination.limit}&offset=${offset}`;
                const { ok: okRefresh, data } = await http.get(pathRefresh);
                if (okRefresh && data && Array.isArray(data.items)) {
                    setUserRatesList(data.items);
                    if (data.pagination) {
                        setUserRatesPagination(data.pagination);
                    }
                }
                // Close modal
                setShowDeleteUserRateModal(false);
                setDeletingUserRate(null);
            } else {
                alert('Не удалось удалить тариф');
            }
        } catch (e) {
            alert('Произошла ошибка при удалении');
        } finally {
            setDeletingUserRateInProgress(false);
        }
    };

    const openEditUserRateModal = (item) => {
        // Format end_date for datetime-local input (YYYY-MM-DDTHH:MM)
        let formattedEndDate = '';
        if (item.end_date) {
            try {
                const date = new Date(item.end_date);
                formattedEndDate = date.toISOString().slice(0, 16);
            } catch (e) {
                formattedEndDate = '';
            }
        }

        setEditingUserRate({
            id: item.id,
            user_id: item.user_id || '',
            city_id: item.city_id || '',
            region_id: item.region_id || '',
            rate: item.rate || '',
            override_commission: item.override_commission || '',
            end_date: formattedEndDate,
            end_orders_count: item.end_orders_count || ''
        });
        // Set commission type based on existing data
        setEditCommissionType(item.override_commission ? 'override' : 'rate');
        setEditUserRateError('');
        setShowEditUserRateModal(true);
    };

    const openDeleteUserRateModal = (item) => {
        setDeletingUserRate(item);
        setShowDeleteUserRateModal(true);
    };

    // Quick add user rate for specific city
    const openAddUserRateForCity = (cityId) => {
        setNewUserRate({
            user_id: '',
            city_id: cityId,
            region_id: '',
            rate: '',
            override_commission: '',
            end_date: '',
            end_orders_count: ''
        });
        setCommissionType('rate');
        setUserRateError('');
        setShowAddUserRateModal(true);
    };

    // Quick add user rate for specific region
    const openAddUserRateForRegion = (regionId) => {
        setNewUserRate({
            user_id: '',
            city_id: '',
            region_id: regionId,
            rate: '',
            override_commission: '',
            end_date: '',
            end_orders_count: ''
        });
        setCommissionType('rate');
        setUserRateError('');
        setShowAddUserRateModal(true);
    };

    if (userRole !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center shadow-sm">
                    <Icon name="Lock" size={38} className="mx-auto mb-4 text-gray-400" />
                    <h1 className="text-lg font-semibold mb-2 text-gray-800">Доступ ограничен</h1>
                    <p className="text-[13px] text-gray-600 mb-4">У вас нет прав для просмотра настроек выплат.</p>
                    <a href="/" className="inline-block px-4 h-9 leading-9 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[12px] font-medium nav-transition">На главную</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 relative p-4">
            {/* Page Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">Настройки выплат</h1>
                <p className="text-sm text-gray-500">Управление комиссиями и рейтами по городам, регионам и пользователям</p>
            </div>

            {/* Filters Panel */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 text-[12px] flex flex-wrap items-center gap-4">
                {/* Offer selector */}
                <div className="min-w-[200px]">
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Оффер</div>
                    <div className="relative">
                        <select
                            value={selectedOfferId || ''}
                            onChange={(e) => setSelectedOfferId(Number(e.target.value))}
                            disabled={loadingOffers || offersList.length === 0}
                            className="w-full h-8 pl-3 pr-8 py-0 border border-gray-300 rounded bg-white text-[12px] leading-8 focus:border-yellow-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 appearance-none"
                            style={{ 
                                WebkitAppearance: 'none',
                                MozAppearance: 'none'
                            }}
                        >
                            {offersList.length === 0 && (
                                <option value="">Загрузка...</option>
                            )}
                            {offersList.map(offer => (
                                <option key={offer.offer_id} value={offer.offer_id}>
                                    {offer.title}
                                </option>
                            ))}
                        </select>
                        <Icon 
                            name="ChevronDown" 
                            size={14} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
                        />
                    </div>
                </div>
                {/* Search */}
                <div className="flex-1 min-w-[240px]">
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">
                        {groupMode === 'cities' ? 'Поиск по городу или региону' : groupMode === 'regions' ? 'Поиск по региону' : 'Поиск по пользователю'}
                    </div>
                    <div className="relative">
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Начните вводить..."
                            className="w-full h-8 px-8 py-0 border border-gray-300 rounded bg-white text-[12px] leading-8 focus:border-yellow-400 focus:outline-none"
                        />
                        <Icon name="Search" size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
                {/* Grouping toggle */}
                <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Группировка</div>
                    <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden text-[12px]">
                        <button
                            className={`px-3 h-8 font-medium nav-transition ${groupMode === 'cities' ? 'bg-yellow-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                            onClick={() => setGroupMode('cities')}
                        >По городам</button>
                        <button
                            className={`px-3 h-8 font-medium nav-transition ${groupMode === 'regions' ? 'bg-yellow-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                            onClick={() => setGroupMode('regions')}
                        >По регионам</button>
                        <button
                            className={`px-3 h-8 font-medium nav-transition ${groupMode === 'users' ? 'bg-yellow-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                            onClick={() => setGroupMode('users')}
                        >По пользователям</button>
                    </div>
                </div>
            </div>

            {/* Cities Table */}
            {groupMode === 'cities' && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    {/* Table header with Add buttons */}
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center flex-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide select-none">
                            <span className="w-48">Город</span>
                            <span className="w-40">Регион</span>
                            <span className="w-32">Базовая комиссия</span>
                            <span className="w-24">Рейт региона</span>
                            <span className="w-32">Итоговая комиссия</span>
                            <span className="flex-1">Тарифы пользователей</span>
                        </div>
                        <div className="ml-2 flex items-center gap-2">
                            <button
                                onClick={() => setShowAddCityModal(true)}
                                className="px-3 h-7 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[11px] font-medium flex items-center gap-1 hover:shadow-md nav-transition"
                            >
                                <Icon name="Plus" size={14} />
                                <span>Добавить город</span>
                            </button>
                            <button
                                onClick={() => setShowAddRegionModal(true)}
                                className="px-3 h-7 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[11px] font-medium flex items-center gap-1 hover:shadow-md nav-transition"
                            >
                                <Icon name="Plus" size={14} />
                                <span>Добавить регион</span>
                            </button>
                            <button
                                onClick={() => {
                                    setNewUserRate({ user_id: '', city_id: '', region_id: '', rate: '', override_commission: '', end_date: '', end_orders_count: '' });
                                    setUserRateError('');
                                    setCommissionType('rate');
                                    setShowAddUserRateModal(true);
                                }}
                                className="px-3 h-7 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[11px] font-medium flex items-center gap-1 hover:shadow-md nav-transition"
                            >
                                <Icon name="Plus" size={14} />
                                Добавить тариф
                            </button>
                        </div>
                    </div>
                    <div className="px-3 py-2 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wide select-none flex items-center sr-only">
                        <span className="w-48">Город</span>
                        <span className="w-40">Регион</span>
                        <span className="w-32">Базовая комиссия</span>
                        <span className="w-24">Рейт региона</span>
                        <span className="w-32">Итоговая комиссия</span>
                        <span className="flex-1">Переопределения пользователей</span>
                    </div>
                    {citiesError ? (
                        <div className="px-3 py-10 text-center text-red-500 text-[12px]">{citiesError}</div>
                    ) : loadingCities ? (
                        <div className="px-3 py-10 text-center text-gray-500 text-[12px]">Загрузка...</div>
                    ) : filteredCities.length === 0 ? (
                        <div className="px-3 py-10 text-center text-gray-500 text-[12px]">
                            {searchQuery.trim() ? 'Ничего не найдено' : 'Нет данных'}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 text-[12px]">
                            {filteredCities.map((item, idx) => {
                                const city = item?.city;
                                const region = item?.region;
                                const userRates = Array.isArray(item?.user_rates) ? item.user_rates : [];
                                const cityName = city?.city || '—';
                                const regionName = region?.region_title || '—';
                                const baseCommission = Number(city?.commission || 0);
                                const regionRate = Number(region?.rate || 1);
                                const finalCommission = baseCommission * regionRate;

                                return (
                                    <div key={city?.city_id || idx} className="px-3 py-2 flex items-start select-none hover:bg-gray-50 nav-transition group">
                                        <span className="w-48 text-gray-800 font-medium">{cityName}</span>
                                        <span className="w-40 text-gray-600">{regionName}</span>
                                        <span className="w-32 text-gray-700">{fmtMoney(baseCommission)} ₽</span>
                                        <span className="w-24 text-gray-700">×{regionRate.toFixed(2)}</span>
                                        <span className="w-32 font-semibold text-gray-900">{fmtMoney(finalCommission)} ₽</span>
                                        <span className="flex-1 pr-2">
                                            {userRates.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {userRates.map((ur, i2) => {
                                                        const userName = ur?.user_full_name || ur?.user_login || `Пользователь ${ur?.user_id}`;
                                                        const userRate = ur?.rate?.rate;
                                                        const overrideComm = ur?.rate?.override_commission;
                                                        let userCommission = finalCommission;
                                                        let formula = '';
                                                        if (overrideComm !== null && overrideComm !== undefined) {
                                                            userCommission = Number(overrideComm);
                                                            formula = `переопр. ${fmtMoney(userCommission)} ₽`;
                                                        } else if (userRate !== null && userRate !== undefined) {
                                                            userCommission = baseCommission * Number(userRate);
                                                            formula = `${fmtMoney(baseCommission)} × ${Number(userRate).toFixed(2)} = ${fmtMoney(userCommission)} ₽`;
                                                        }
                                                        return (
                                                            <div key={(ur?.user_id || '') + i2} className="flex items-center gap-2 text-[11px] text-gray-600 group/userrate">
                                                                <Icon name="User" size={12} className="opacity-70" />
                                                                <span className="truncate font-medium text-gray-700" title={userName}>{userName}</span>
                                                                <span className="text-gray-400">·</span>
                                                                <span className="text-gray-500 font-mono" title={formula}>{fmtMoney(userCommission)} ₽</span>
                                                                <button
                                                                    onClick={() => openDeleteUserRateModal(ur?.rate)}
                                                                    className="opacity-0 group-hover/userrate:opacity-100 p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded nav-transition"
                                                                    title="Удалить тариф"
                                                                >
                                                                    <Icon name="X" size={12} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-[11px]">—</span>
                                            )}
                                        </span>
                                        <div className="ml-2 opacity-0 group-hover:opacity-100 nav-transition flex items-center gap-1">
                                            <button
                                                onClick={() => openAddUserRateForCity(city?.city_id)}
                                                className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded nav-transition"
                                                title="Добавить пользовательский тариф"
                                            >
                                                <Icon name="UserPlus" size={14} />
                                            </button>
                                            <button
                                                onClick={() => openEditCityModal(item)}
                                                className="p-1 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded nav-transition"
                                                title="Редактировать"
                                            >
                                                <Icon name="Pencil" size={14} />
                                            </button>
                                            <button
                                                onClick={() => openDeleteCityModal(item)}
                                                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded nav-transition"
                                                title="Удалить"
                                            >
                                                <Icon name="Trash2" size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Cities Pagination */}
                    {!citiesError && !loadingCities && citiesPagination.pages > 1 && (
                        <div className="px-3 py-3 border-t border-gray-100 flex items-center justify-between text-[12px]">
                            <div className="text-gray-600">
                                Всего: <span className="font-semibold">{citiesPagination.total}</span> городов
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCitiesPage(prev => Math.max(1, prev - 1))}
                                    disabled={citiesPage === 1}
                                    className="px-3 h-7 rounded-md border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 nav-transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <Icon name="ChevronLeft" size={14} />
                                    <span>Назад</span>
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: citiesPagination.pages }, (_, i) => i + 1).map(page => {
                                        // Show first, last, current and neighbors
                                        if (
                                            page === 1 ||
                                            page === citiesPagination.pages ||
                                            (page >= citiesPage - 1 && page <= citiesPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCitiesPage(page)}
                                                    className={`w-7 h-7 rounded-md font-medium nav-transition ${page === citiesPage
                                                        ? 'bg-yellow-100 text-gray-900 border border-yellow-300'
                                                        : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (page === citiesPage - 2 || page === citiesPage + 2) {
                                            return <span key={page} className="text-gray-400">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <button
                                    onClick={() => setCitiesPage(prev => Math.min(citiesPagination.pages, prev + 1))}
                                    disabled={citiesPage === citiesPagination.pages}
                                    className="px-3 h-7 rounded-md border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 nav-transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <span>Вперед</span>
                                    <Icon name="ChevronRight" size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Regions Table */}
            {groupMode === 'regions' && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    {/* Table header with Add buttons */}
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center flex-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide select-none">
                            <span className="w-64">Регион</span>
                            <span className="w-32">Базовая комиссия</span>
                            <span className="w-24">Рейт региона</span>
                            <span className="w-32">Итоговая комиссия</span>
                            <span className="flex-1">Переопределения пользователей</span>
                        </div>
                        <div className="ml-2 flex items-center gap-2">
                            <button
                                onClick={() => setShowAddCityModal(true)}
                                className="px-3 h-7 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[11px] font-medium flex items-center gap-1 hover:shadow-md nav-transition"
                            >
                                <Icon name="Plus" size={14} />
                                <span>Добавить город</span>
                            </button>
                            <button
                                onClick={() => setShowAddRegionModal(true)}
                                className="px-3 h-7 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[11px] font-medium flex items-center gap-1 hover:shadow-md nav-transition"
                            >
                                <Icon name="Plus" size={14} />
                                <span>Добавить регион</span>
                            </button>
                            <button
                                onClick={() => {
                                    setNewUserRate({ user_id: '', city_id: '', region_id: '', rate: '', override_commission: '', end_date: '', end_orders_count: '' });
                                    setUserRateError('');
                                    setCommissionType('rate');
                                    setShowAddUserRateModal(true);
                                }}
                                className="px-3 h-7 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[11px] font-medium flex items-center gap-1 hover:shadow-md nav-transition"
                            >
                                <Icon name="Plus" size={14} />
                                Добавить тариф
                            </button>
                        </div>
                    </div>
                    {regionsError ? (
                        <div className="px-3 py-10 text-center text-red-500 text-[12px]">{regionsError}</div>
                    ) : loadingRegions ? (
                        <div className="px-3 py-10 text-center text-gray-500 text-[12px]">Загрузка...</div>
                    ) : filteredRegions.length === 0 ? (
                        <div className="px-3 py-10 text-center text-gray-500 text-[12px]">
                            {searchQuery.trim() ? 'Ничего не найдено' : 'Нет данных'}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 text-[12px]">
                            {filteredRegions.map((item, idx) => {
                                const region = item?.region;
                                const userRates = Array.isArray(item?.user_rates) ? item.user_rates : [];
                                const regionName = region?.region_title || '—';
                                const baseCommission = Number(region?.base_comission || 0);
                                const regionRate = Number(region?.rate || 1);
                                const finalCommission = baseCommission * regionRate;

                                return (
                                    <div key={region?.region_id || idx} className="px-3 py-2 flex items-start select-none hover:bg-gray-50 nav-transition group">
                                        <span className="w-64 text-gray-800 font-medium">{regionName}</span>
                                        <span className="w-32 text-gray-700">{fmtMoney(baseCommission)} ₽</span>
                                        <span className="w-24 text-gray-700">×{regionRate.toFixed(2)}</span>
                                        <span className="w-32 font-semibold text-gray-900">{fmtMoney(finalCommission)} ₽</span>
                                        <span className="flex-1 pr-2">
                                            {userRates.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {userRates.map((ur, i2) => {
                                                        const userName = ur?.user_full_name || ur?.user_login || `Пользователь ${ur?.user_id}`;
                                                        const userRate = ur?.rate?.rate;
                                                        const overrideComm = ur?.rate?.override_commission;
                                                        let userCommission = finalCommission;
                                                        let formula = '';
                                                        if (overrideComm !== null && overrideComm !== undefined) {
                                                            userCommission = Number(overrideComm);
                                                            formula = `переопр. ${fmtMoney(userCommission)} ₽`;
                                                        } else if (userRate !== null && userRate !== undefined) {
                                                            userCommission = baseCommission * Number(userRate);
                                                            formula = `${fmtMoney(baseCommission)} × ${Number(userRate).toFixed(2)} = ${fmtMoney(userCommission)} ₽`;
                                                        }
                                                        return (
                                                            <div key={(ur?.user_id || '') + i2} className="flex items-center gap-2 text-[11px] text-gray-600 group/userrate">
                                                                <Icon name="User" size={12} className="opacity-70" />
                                                                <span className="truncate font-medium text-gray-700" title={userName}>{userName}</span>
                                                                <span className="text-gray-400">·</span>
                                                                <span className="text-gray-500 font-mono" title={formula}>{fmtMoney(userCommission)} ₽</span>
                                                                <button
                                                                    onClick={() => openDeleteUserRateModal(ur?.rate)}
                                                                    className="opacity-0 group-hover/userrate:opacity-100 p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded nav-transition"
                                                                    title="Удалить тариф"
                                                                >
                                                                    <Icon name="X" size={12} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-[11px]">—</span>
                                            )}
                                        </span>
                                        <div className="ml-2 opacity-0 group-hover:opacity-100 nav-transition flex items-center gap-1">
                                            <button
                                                onClick={() => openAddUserRateForRegion(region?.region_id)}
                                                className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded nav-transition"
                                                title="Добавить пользовательский тариф"
                                            >
                                                <Icon name="UserPlus" size={14} />
                                            </button>
                                            <button
                                                onClick={() => openEditRegionModal(item)}
                                                className="p-1 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded nav-transition"
                                                title="Редактировать"
                                            >
                                                <Icon name="Pencil" size={14} />
                                            </button>
                                            <button
                                                onClick={() => openDeleteRegionModal(item)}
                                                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded nav-transition"
                                                title="Удалить"
                                            >
                                                <Icon name="Trash2" size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Regions Pagination */}
                    {!regionsError && !loadingRegions && regionsPagination.pages > 1 && (
                        <div className="px-3 py-3 border-t border-gray-100 flex items-center justify-between text-[12px]">
                            <div className="text-gray-600">
                                Всего: <span className="font-semibold">{regionsPagination.total}</span> регионов
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setRegionsPage(prev => Math.max(1, prev - 1))}
                                    disabled={regionsPage === 1}
                                    className="px-3 h-7 rounded-md border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 nav-transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <Icon name="ChevronLeft" size={14} />
                                    <span>Назад</span>
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: regionsPagination.pages }, (_, i) => i + 1).map(page => {
                                        // Show first, last, current and neighbors
                                        if (
                                            page === 1 ||
                                            page === regionsPagination.pages ||
                                            (page >= regionsPage - 1 && page <= regionsPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setRegionsPage(page)}
                                                    className={`w-7 h-7 rounded-md font-medium nav-transition ${page === regionsPage
                                                        ? 'bg-yellow-100 text-gray-900 border border-yellow-300'
                                                        : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (page === regionsPage - 2 || page === regionsPage + 2) {
                                            return <span key={page} className="text-gray-400">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <button
                                    onClick={() => setRegionsPage(prev => Math.min(regionsPagination.pages, prev + 1))}
                                    disabled={regionsPage === regionsPagination.pages}
                                    className="px-3 h-7 rounded-md border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 nav-transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <span>Вперед</span>
                                    <Icon name="ChevronRight" size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* User Rates Grouping */}
            {groupMode === 'users' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <Icon name="Users" size={16} />
                            Пользовательские тарифы
                        </h2>
                        <button
                            onClick={() => {
                                setNewUserRate({ user_id: '', city_id: '', region_id: '', rate: '', override_commission: '', end_date: '', end_orders_count: '' });
                                setUserRateError('');
                                setCommissionType('rate');
                                setShowAddUserRateModal(true);
                            }}
                            className="px-3 h-7 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[11px] font-medium flex items-center gap-1 hover:shadow-md nav-transition"
                        >
                            <Icon name="Plus" size={14} />
                            Добавить тариф
                        </button>
                    </div>

                    {loadingUserRates && (
                        <div className="text-center py-12">
                            <Icon name="Loader2" size={28} className="mx-auto text-yellow-500 animate-spin" />
                            <p className="text-[12px] text-gray-500 mt-2">Загружаем тарифы...</p>
                        </div>
                    )}

                    {!loadingUserRates && userRatesError && (
                        <div className="text-center py-12">
                            <Icon name="AlertTriangle" size={28} className="mx-auto text-red-500 mb-2" />
                            <p className="text-[12px] text-red-600">{userRatesError}</p>
                        </div>
                    )}

                    {!loadingUserRates && !userRatesError && userRatesList.length === 0 && (
                        <div className="text-center py-12">
                            <Icon name="Users" size={28} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-[12px] text-gray-500">Нет пользовательских тарифов</p>
                        </div>
                    )}

                    {!loadingUserRates && !userRatesError && userRatesList.length > 0 && (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Пользователь</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Город/Регион</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Тариф/Переопределение</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Дата окончания</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Заказов до окончания</th>
                                            <th className="text-center py-2 px-3 font-semibold text-gray-700 w-20">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userRatesList.map((item) => {
                                            // Item structure: { rate: {...}, user_login: "...", user_full_name: "..." }
                                            const rate = item.rate || {};
                                            const locationLabel = rate.city_id
                                                ? (citiesMap.get(rate.city_id) || `Город #${rate.city_id}`)
                                                : (regionsMap.get(rate.region_id) || `Регион #${rate.region_id}`);

                                            const rateDisplay = rate.override_commission
                                                ? `${fmtMoney(rate.override_commission)} ₽ (фикс.)`
                                                : rate.rate
                                                    ? `×${rate.rate}`
                                                    : '—';

                                            // User info from response
                                            const userName = item.user_full_name || item.user_login || `Пользователь #${rate.user_id}`;
                                            const userId = rate.user_id;

                                            // Copy user ID to clipboard
                                            const copyUserId = (e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(userId.toString()).then(() => {
                                                    // Visual feedback: briefly change the element
                                                    const target = e.currentTarget;
                                                    const originalHTML = target.innerHTML;
                                                    target.innerHTML = '<span>✓ Скопировано</span>';
                                                    target.style.color = '#22c55e'; // green
                                                    setTimeout(() => {
                                                        target.innerHTML = originalHTML;
                                                        target.style.color = '';
                                                    }, 1500);
                                                });
                                            };

                                            return (
                                                <tr key={rate.id} className="border-b border-gray-100 hover:bg-yellow-50 nav-transition group">
                                                    <td className="py-2 px-3 text-gray-800">
                                                        <div>
                                                            <div className="font-medium">{userName}</div>
                                                            <div
                                                                className="text-[10px] text-gray-500 cursor-pointer hover:text-yellow-600 nav-transition flex items-center gap-1 w-fit"
                                                                onClick={copyUserId}
                                                                title="Нажмите, чтобы скопировать ID"
                                                            >
                                                                <span>ID: {userId}</span>
                                                                <Icon name="Clipboard" size={10} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-700">
                                                        {locationLabel}
                                                        <span className="ml-2 text-[10px] text-gray-500">
                                                            {rate.city_id ? '(город)' : '(регион)'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-800 font-medium">
                                                        {rateDisplay}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-700">
                                                        {rate.end_date ? new Date(rate.end_date).toLocaleString('ru-RU', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : '—'}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-700">
                                                        {rate.end_orders_count || '—'}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 nav-transition">
                                                            <button
                                                                onClick={() => openEditUserRateModal(rate)}
                                                                className="p-1 rounded hover:bg-yellow-100 nav-transition"
                                                                title="Редактировать"
                                                            >
                                                                <Icon name="Pencil" size={14} className="text-gray-600" />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteUserRateModal(rate)}
                                                                className="p-1 rounded hover:bg-red-100 nav-transition"
                                                                title="Удалить"
                                                            >
                                                                <Icon name="Trash2" size={14} className="text-red-600" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination for user rates */}
                            {userRatesPagination.pages > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-[12px] text-gray-600">
                                        Всего: {userRatesPagination.total} тарифов
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setUserRatesPage(prev => Math.max(1, prev - 1))}
                                            disabled={userRatesPage === 1}
                                            className="px-3 h-7 rounded-md border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 nav-transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            <Icon name="ChevronLeft" size={14} />
                                            <span>Назад</span>
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: userRatesPagination.pages }, (_, i) => i + 1).map(page => {
                                                if (
                                                    page === 1 ||
                                                    page === userRatesPagination.pages ||
                                                    (page >= userRatesPage - 1 && page <= userRatesPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => setUserRatesPage(page)}
                                                            className={`w-7 h-7 rounded-md font-medium nav-transition ${page === userRatesPage
                                                                ? 'bg-yellow-100 text-gray-900 border border-yellow-300'
                                                                : 'text-gray-600 hover:bg-gray-50 border border-gray-300'
                                                                }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                } else if (page === userRatesPage - 2 || page === userRatesPage + 2) {
                                                    return <span key={page} className="text-gray-400">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setUserRatesPage(prev => Math.min(userRatesPagination.pages, prev + 1))}
                                            disabled={userRatesPage === userRatesPagination.pages}
                                            className="px-3 h-7 rounded-md border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 nav-transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            <span>Вперед</span>
                                            <Icon name="ChevronRight" size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Add City Modal */}
            <AddCityModal
                show={showAddCityModal}
                onClose={() => setShowAddCityModal(false)}
                newCity={newCity}
                setNewCity={setNewCity}
                regionsList={regionsList}
                saving={savingCity}
                error={cityError}
                cityExists={cityExists}
                onSave={handleAddCity}
            />

            {/* Edit City Modal */}
            <EditCityModal
                show={showEditCityModal}
                onClose={() => setShowEditCityModal(false)}
                editingCity={editingCity}
                setEditingCity={setEditingCity}
                regionsList={regionsList}
                saving={savingEditCity}
                error={editCityError}
                editedCityExists={editedCityExists}
                onSave={handleEditCity}
            />

            {/* Delete City Confirmation Modal */}
            {showDeleteCityModal && deletingCity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !deletingCityInProgress && setShowDeleteCityModal(false)}></div>
                    <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <Icon name="AlertTriangle" size={16} className="text-red-500" />
                                Удалить город?
                            </h2>
                            <button
                                onClick={() => !deletingCityInProgress && setShowDeleteCityModal(false)}
                                className="text-gray-400 hover:text-gray-600 nav-transition"
                                disabled={deletingCityInProgress}
                            >
                                <Icon name="X" size={18} />
                            </button>
                        </div>
                        <p className="text-[13px] text-gray-600 mb-5">
                            Вы уверены, что хотите удалить город <strong>{deletingCity.city}</strong>?
                            Это действие нельзя отменить.
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                            <button
                                onClick={() => setShowDeleteCityModal(false)}
                                disabled={deletingCityInProgress}
                                className="px-4 h-9 rounded-md border border-gray-300 text-gray-600 text-[12px] font-medium hover:border-gray-400 nav-transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleDeleteCity}
                                disabled={deletingCityInProgress}
                                className="px-4 h-9 rounded-md bg-red-500 text-white text-[12px] font-medium flex items-center gap-1 hover:bg-red-600 nav-transition disabled:opacity-60 disabled:cursor-wait"
                            >
                                {deletingCityInProgress ? (
                                    <>
                                        <Icon name="Loader2" size={14} className="animate-spin" />
                                        <span>Удаление...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="Trash2" size={14} />
                                        <span>Удалить</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Region Modal */}
            {showAddRegionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !savingRegion && setShowAddRegionModal(false)}></div>
                    <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-md p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <Icon name="Map" size={16} />
                                Добавить регион
                            </h2>
                            <button
                                onClick={() => !savingRegion && setShowAddRegionModal(false)}
                                className="text-gray-400 hover:text-gray-600 nav-transition"
                                disabled={savingRegion}
                            >
                                <Icon name="X" size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {/* Region title */}
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                    Название региона <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newRegion.region_title}
                                    onChange={e => setNewRegion(prev => ({ ...prev, region_title: e.target.value }))}
                                    placeholder="Например: Московская область"
                                    className={`w-full h-9 px-3 border rounded-md text-[13px] focus:outline-none ${regionExists
                                        ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                                        : 'border-gray-300 focus:border-yellow-400'
                                        }`}
                                    disabled={savingRegion}
                                />
                                {regionExists && (
                                    <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                                        <Icon name="AlertTriangle" size={12} />
                                        <span>Регион с таким названием уже существует</span>
                                    </div>
                                )}
                            </div>
                            {/* Base commission */}
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                    Базовая комиссия, ₽ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={newRegion.base_comission}
                                    onChange={e => setNewRegion(prev => ({ ...prev, base_comission: e.target.value }))}
                                    placeholder="1000"
                                    min="0"
                                    step="100"
                                    className="w-full h-9 px-3 border border-gray-300 rounded-md text-[13px] focus:border-yellow-400 focus:outline-none"
                                    disabled={savingRegion}
                                />
                            </div>
                            {/* Rate */}
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                    Рейт региона <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={newRegion.rate}
                                    onChange={e => setNewRegion(prev => ({ ...prev, rate: e.target.value }))}
                                    placeholder="1.0"
                                    min="0.01"
                                    step="0.1"
                                    className="w-full h-9 px-3 border border-gray-300 rounded-md text-[13px] focus:border-yellow-400 focus:outline-none"
                                    disabled={savingRegion}
                                />
                            </div>
                            {/* Error message */}
                            {regionError && (
                                <div className="text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-md p-2">
                                    {regionError}
                                </div>
                            )}
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-5 justify-end">
                            <button
                                onClick={() => setShowAddRegionModal(false)}
                                disabled={savingRegion}
                                className="px-4 h-9 rounded-md border border-gray-300 text-gray-600 text-[12px] font-medium hover:border-gray-400 nav-transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleAddRegion}
                                disabled={savingRegion}
                                className="px-4 h-9 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[12px] font-medium flex items-center gap-1 hover:shadow-md nav-transition disabled:opacity-60 disabled:cursor-wait"
                            >
                                {savingRegion ? (
                                    <>
                                        <Icon name="Loader2" size={14} className="animate-spin" />
                                        <span>Сохранение...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="Check" size={14} />
                                        <span>Добавить</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Region Modal */}
            {showEditRegionModal && editingRegion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !savingEditRegion && setShowEditRegionModal(false)}></div>
                    <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-md p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <Icon name="Pencil" size={16} />
                                Редактировать регион
                            </h2>
                            <button
                                onClick={() => !savingEditRegion && setShowEditRegionModal(false)}
                                className="text-gray-400 hover:text-gray-600 nav-transition"
                                disabled={savingEditRegion}
                            >
                                <Icon name="X" size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {/* Region title */}
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                    Название региона <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editingRegion.region_title}
                                    onChange={e => setEditingRegion(prev => ({ ...prev, region_title: e.target.value }))}
                                    placeholder="Например: Московская область"
                                    className={`w-full h-9 px-3 border rounded-md text-[13px] focus:outline-none ${editedRegionExists
                                        ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                                        : 'border-gray-300 focus:border-yellow-400'
                                        }`}
                                    disabled={savingEditRegion}
                                />
                                {editedRegionExists && (
                                    <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                                        <Icon name="AlertTriangle" size={12} />
                                        <span>Регион с таким названием уже существует</span>
                                    </div>
                                )}
                            </div>
                            {/* Base commission */}
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                    Базовая комиссия, ₽ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={editingRegion.base_comission}
                                    onChange={e => setEditingRegion(prev => ({ ...prev, base_comission: e.target.value }))}
                                    placeholder="1000"
                                    min="0"
                                    step="100"
                                    className="w-full h-9 px-3 border border-gray-300 rounded-md text-[13px] focus:border-yellow-400 focus:outline-none"
                                    disabled={savingEditRegion}
                                />
                            </div>
                            {/* Rate */}
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                    Рейт региона <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={editingRegion.rate}
                                    onChange={e => setEditingRegion(prev => ({ ...prev, rate: e.target.value }))}
                                    placeholder="1.0"
                                    min="0.01"
                                    step="0.1"
                                    className="w-full h-9 px-3 border border-gray-300 rounded-md text-[13px] focus:border-yellow-400 focus:outline-none"
                                    disabled={savingEditRegion}
                                />
                            </div>
                            {/* Error message */}
                            {editRegionError && (
                                <div className="text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-md p-2">
                                    {editRegionError}
                                </div>
                            )}
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-5 justify-end">
                            <button
                                onClick={() => setShowEditRegionModal(false)}
                                disabled={savingEditRegion}
                                className="px-4 h-9 rounded-md border border-gray-300 text-gray-600 text-[12px] font-medium hover:border-gray-400 nav-transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleEditRegion}
                                disabled={savingEditRegion}
                                className="px-4 h-9 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[12px] font-medium flex items-center gap-1 hover:shadow-md nav-transition disabled:opacity-60 disabled:cursor-wait"
                            >
                                {savingEditRegion ? (
                                    <>
                                        <Icon name="Loader2" size={14} className="animate-spin" />
                                        <span>Сохранение...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="Check" size={14} />
                                        <span>Сохранить</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Region Confirmation Modal */}
            {showDeleteRegionModal && deletingRegion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !deletingRegionInProgress && setShowDeleteRegionModal(false)}></div>
                    <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <Icon name="AlertTriangle" size={16} className="text-red-500" />
                                Удалить регион?
                            </h2>
                            <button
                                onClick={() => !deletingRegionInProgress && setShowDeleteRegionModal(false)}
                                className="text-gray-400 hover:text-gray-600 nav-transition"
                                disabled={deletingRegionInProgress}
                            >
                                <Icon name="X" size={18} />
                            </button>
                        </div>
                        <p className="text-[13px] text-gray-600 mb-5">
                            Вы уверены, что хотите удалить регион <strong>{deletingRegion.region_title}</strong>?
                            Это действие нельзя отменить.
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                            <button
                                onClick={() => setShowDeleteRegionModal(false)}
                                disabled={deletingRegionInProgress}
                                className="px-4 h-9 rounded-md border border-gray-300 text-gray-600 text-[12px] font-medium hover:border-gray-400 nav-transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleDeleteRegion}
                                disabled={deletingRegionInProgress}
                                className="px-4 h-9 rounded-md bg-red-500 text-white text-[12px] font-medium flex items-center gap-1 hover:bg-red-600 nav-transition disabled:opacity-60 disabled:cursor-wait"
                            >
                                {deletingRegionInProgress ? (
                                    <>
                                        <Icon name="Loader2" size={14} className="animate-spin" />
                                        <span>Удаление...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="Trash2" size={14} />
                                        <span>Удалить</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Rate Modal */}
            <AddUserRateModal
                show={showAddUserRateModal}
                onClose={() => setShowAddUserRateModal(false)}
                newUserRate={newUserRate}
                setNewUserRate={setNewUserRate}
                usersList={usersList}
                citiesList={citiesList}
                regionsList={regionsList}
                saving={savingUserRate}
                error={userRateError}
                commissionType={commissionType}
                setCommissionType={setCommissionType}
                onSave={handleAddUserRate}
            />

            {/* Edit User Rate Modal */}
            <EditUserRateModal
                show={showEditUserRateModal}
                onClose={() => setShowEditUserRateModal(false)}
                editingUserRate={editingUserRate}
                setEditingUserRate={setEditingUserRate}
                usersList={usersList}
                citiesList={citiesList}
                regionsList={regionsList}
                saving={savingEditUserRate}
                error={editUserRateError}
                commissionType={editCommissionType}
                setCommissionType={setEditCommissionType}
                onSave={handleEditUserRate}
            />

            {/* Delete User Rate Confirmation Modal */}
            <DeleteUserRateModal
                show={showDeleteUserRateModal}
                onClose={() => setShowDeleteUserRateModal(false)}
                deletingUserRate={deletingUserRate}
                deleting={deletingUserRateInProgress}
                onDelete={handleDeleteUserRate}
            />
        </div>
    );
};

export default RatesSettingsPage;
