import React from 'react';
import Icon from 'components/AppIcon';

const EditCityModal = ({
    show,
    onClose,
    editingCity,
    setEditingCity,
    regionsList,
    saving,
    error,
    editedCityExists,
    onSave
}) => {
    if (!show || !editingCity) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !saving && onClose()}></div>
            <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-md p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <Icon name="Pencil" size={16} />
                        Редактировать город
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
                    {/* City name */}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Название города <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Например, Москва"
                            value={editingCity.city}
                            onChange={(e) => setEditingCity({ ...editingCity, city: e.target.value })}
                            className={`w-full h-9 px-3 border rounded-md text-[12px] nav-transition focus:outline-none ${
                                editedCityExists 
                                    ? 'border-amber-400 focus:border-amber-400' 
                                    : 'border-gray-300 focus:border-yellow-400'
                            }`}
                            disabled={saving}
                        />
                        {editedCityExists && (
                            <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                                <Icon name="AlertTriangle" size={12} />
                                Город с таким названием уже существует
                            </p>
                        )}
                    </div>

                    {/* Region selection */}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Регион <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={editingCity.region_id}
                            onChange={(e) => setEditingCity({ ...editingCity, region_id: e.target.value })}
                            className="w-full h-9 px-3 border border-gray-300 rounded-md text-[12px] nav-transition focus:border-yellow-400 focus:outline-none"
                            disabled={saving}
                        >
                            <option value="">Выберите регион</option>
                            {regionsList.map(item => (
                                <option key={item.region?.region_id} value={item.region?.region_id}>
                                    {item.region?.region_title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Commission */}
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Комиссия (₽) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Например, 1000"
                            value={editingCity.commission}
                            onChange={(e) => setEditingCity({ ...editingCity, commission: e.target.value })}
                            className="w-full h-9 px-3 border border-gray-300 rounded-md text-[12px] nav-transition focus:border-yellow-400 focus:outline-none"
                            disabled={saving}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 p-2 border border-red-300 bg-red-50 rounded-md">
                            <Icon name="AlertTriangle" size={14} className="text-red-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-red-700">{error}</p>
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
                            disabled={saving || editedCityExists}
                            className="px-4 h-9 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-[12px] font-medium flex items-center gap-1 hover:shadow-md nav-transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {saving ? (
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
        </div>
    );
};

export default EditCityModal;
