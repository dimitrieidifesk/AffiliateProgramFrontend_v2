import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';
import SingleSelect from 'components/filters/SingleSelect';

const AddUserRateModal = ({
    show,
    onClose,
    newUserRate,
    setNewUserRate,
    usersList,
    citiesList,
    regionsList,
    saving,
    error,
    commissionType,
    setCommissionType,
    onSave
}) => {
    // Local state to track location type selection (city or region)
    const [locationType, setLocationType] = useState('city');

    // Sync locationType with newUserRate data when modal opens or data changes
    useEffect(() => {
        if (show) {
            if (newUserRate.region_id && !newUserRate.city_id) {
                setLocationType('region');
            } else {
                setLocationType('city');
            }
        }
    }, [show, newUserRate.city_id, newUserRate.region_id]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !saving && onClose()}></div>
            <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <Icon name="Users" size={16} />
                        Добавить пользовательский тариф
                    </h2>
                    <button
                        onClick={() => !saving && onClose()}
                        className="text-gray-400 hover:text-gray-600 nav-transition"
                        disabled={saving}
                    >
                        <Icon name="X" size={18} />
                    </button>
                </div>
                <div className="space-y-3">
                    {/* User selection with search */}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Пользователь <span className="text-red-500">*</span>
                        </label>
                        <SingleSelect
                            value={newUserRate.user_id}
                            onChange={(value) => setNewUserRate({ ...newUserRate, user_id: value })}
                            options={usersList.map(user => {
                                const displayName = user.full_name || user.login || user.email || `User #${user.id}`;
                                return {
                                    value: user.id,
                                    label: `${displayName} (ID: ${user.id})`
                                };
                            })}
                            placeholder="Выберите пользователя"
                            icon="User"
                            disabled={saving}
                        />
                    </div>

                    {/* Location type radio */}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Привязка <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                                <input
                                    type="radio"
                                    name="location-type-add"
                                    value="city"
                                    checked={locationType === 'city'}
                                    onChange={() => {
                                        setLocationType('city');
                                        setNewUserRate({ ...newUserRate, region_id: '' });
                                    }}
                                    disabled={saving}
                                />
                                <span>Город</span>
                            </label>
                            <label className="flex items-center gap-2 text-[12px] cursor-pointer">
                                <input
                                    type="radio"
                                    name="location-type-add"
                                    value="region"
                                    checked={locationType === 'region'}
                                    onChange={() => {
                                        setLocationType('region');
                                        setNewUserRate({ ...newUserRate, city_id: '' });
                                    }}
                                    disabled={saving}
                                />
                                <span>Регион</span>
                            </label>
                        </div>
                    </div>

                    {/* City or Region selection */}
                    {locationType === 'city' && (
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                                Город <span className="text-red-500">*</span>
                            </label>
                            <SingleSelect
                                value={newUserRate.city_id}
                                onChange={(value) => setNewUserRate({ ...newUserRate, city_id: value })}
                                options={citiesList.map(item => ({
                                    value: item.city?.city_id,
                                    label: item.city?.city
                                }))}
                                placeholder="Выберите город"
                                icon="MapPin"
                                disabled={saving}
                            />
                        </div>
                    )}

                    {locationType === 'region' && (
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                                Регион <span className="text-red-500">*</span>
                            </label>
                            <SingleSelect
                                value={newUserRate.region_id}
                                onChange={(value) => setNewUserRate({ ...newUserRate, region_id: value })}
                                options={regionsList.map(item => ({
                                    value: item.region?.region_id,
                                    label: item.region?.region_title
                                }))}
                                placeholder="Выберите регион"
                                icon="Map"
                                disabled={saving}
                            />
                        </div>
                    )}

                    {/* Commission type selection */}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Тип комиссии
                        </label>
                        <div className="flex items-center gap-4 mb-2">
                            <label className="flex items-center gap-2 text-[12px]">
                                <input
                                    type="radio"
                                    checked={commissionType === 'rate'}
                                    onChange={() => {
                                        setCommissionType('rate');
                                        setNewUserRate({ ...newUserRate, override_commission: '' });
                                    }}
                                    disabled={saving}
                                />
                                <span>Множитель тарифа</span>
                            </label>
                            <label className="flex items-center gap-2 text-[12px]">
                                <input
                                    type="radio"
                                    checked={commissionType === 'override'}
                                    onChange={() => {
                                        setCommissionType('override');
                                        setNewUserRate({ ...newUserRate, rate: '' });
                                    }}
                                    disabled={saving}
                                />
                                <span>Фиксированная комиссия</span>
                            </label>
                        </div>

                        {commissionType === 'rate' && (
                            <div>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="1.0"
                                    value={newUserRate.rate}
                                    onChange={(e) => setNewUserRate({ ...newUserRate, rate: e.target.value })}
                                    className="w-full h-9 px-3 border border-gray-300 rounded-md text-[12px] nav-transition focus:border-yellow-400 focus:outline-none"
                                    disabled={saving}
                                />
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    Множитель, применяемый к базовой комиссии (например, 1.2 = +20%)
                                </p>
                            </div>
                        )}

                        {commissionType === 'override' && (
                            <div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="например, 1500"
                                        value={newUserRate.override_commission}
                                        onChange={(e) => setNewUserRate({ ...newUserRate, override_commission: e.target.value })}
                                        className="w-full h-9 px-3 pr-8 border border-gray-300 rounded-md text-[12px] nav-transition focus:border-yellow-400 focus:outline-none"
                                        disabled={saving}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-500">₽</span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    Фиксированная комиссия в рублях для всех лидов этого города/региона
                                </p>
                            </div>
                        )}
                    </div>

                    {/* End date */}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Дата окончания
                        </label>
                        <input
                            type="datetime-local"
                            value={newUserRate.end_date}
                            onChange={(e) => setNewUserRate({ ...newUserRate, end_date: e.target.value })}
                            className="w-full h-9 px-3 border border-gray-300 rounded-md text-[12px] nav-transition focus:border-yellow-400 focus:outline-none"
                            disabled={saving}
                        />
                    </div>

                    {/* End orders count */}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Количество заказов до окончания
                        </label>
                        <input
                            type="number"
                            placeholder="например, 100"
                            value={newUserRate.end_orders_count}
                            onChange={(e) => setNewUserRate({ ...newUserRate, end_orders_count: e.target.value })}
                            className="w-full h-9 px-3 border border-gray-300 rounded-md text-[12px] nav-transition focus:border-yellow-400 focus:outline-none"
                            disabled={saving}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 p-2 border border-amber-300 bg-amber-50 rounded-md">
                            <Icon name="AlertTriangle" size={14} className="text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-amber-700">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 justify-end pt-2">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 h-9 rounded-md border border-gray-300 text-gray-600 text-[12px] font-medium hover:border-gray-400 nav-transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="px-4 h-9 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[12px] font-medium flex items-center gap-1 hover:shadow-md nav-transition disabled:opacity-60 disabled:cursor-wait"
                        >
                            {saving ? (
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
        </div>
    );
};

export default AddUserRateModal;
