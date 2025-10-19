import React from 'react';
import Icon from 'components/AppIcon';

export const AddRegionModal = ({
    show,
    onClose,
    newRegion,
    setNewRegion,
    saving,
    error,
    regionExists,
    onSave
}) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !saving && onClose()}></div>
            <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-md p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <Icon name="Map" size={16} />
                        Добавить регион
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
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Название региона <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Например, Московская область"
                            value={newRegion.region_title}
                            onChange={(e) => setNewRegion({ ...newRegion, region_title: e.target.value })}
                            className={`w-full h-9 px-3 border rounded-md text-[12px] nav-transition focus:outline-none ${
                                regionExists 
                                    ? 'border-amber-400 focus:border-amber-400' 
                                    : 'border-gray-300 focus:border-yellow-400'
                            }`}
                            disabled={saving}
                        />
                        {regionExists && (
                            <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                                <Icon name="AlertTriangle" size={12} />
                                Регион с таким названием уже существует
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Базовая комиссия (₽) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Например, 1000"
                            value={newRegion.base_comission}
                            onChange={(e) => setNewRegion({ ...newRegion, base_comission: e.target.value })}
                            className="w-full h-9 px-3 border border-gray-300 rounded-md text-[12px] nav-transition focus:border-yellow-400 focus:outline-none"
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Коэффициент (rate) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="1.0"
                            value={newRegion.rate}
                            onChange={(e) => setNewRegion({ ...newRegion, rate: e.target.value })}
                            className="w-full h-9 px-3 border border-gray-300 rounded-md text-[12px] nav-transition focus:border-yellow-400 focus:outline-none"
                            disabled={saving}
                        />
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-2 border border-red-300 bg-red-50 rounded-md">
                            <Icon name="AlertTriangle" size={14} className="text-red-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-red-700">{error}</p>
                        </div>
                    )}

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
                            disabled={saving || regionExists}
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

export const EditRegionModal = ({
    show,
    onClose,
    editingRegion,
    setEditingRegion,
    saving,
    error,
    editedRegionExists,
    onSave
}) => {
    if (!show || !editingRegion) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !saving && onClose()}></div>
            <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-md p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <Icon name="Pencil" size={16} />
                        Редактировать регион
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
                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Название региона <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Например, Московская область"
                            value={editingRegion.region_title}
                            onChange={(e) => setEditingRegion({ ...editingRegion, region_title: e.target.value })}
                            className={`w-full h-9 px-3 border rounded-md text-[12px] nav-transition focus:outline-none ${
                                editedRegionExists 
                                    ? 'border-amber-400 focus:border-amber-400' 
                                    : 'border-gray-300 focus:border-yellow-400'
                            }`}
                            disabled={saving}
                        />
                        {editedRegionExists && (
                            <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                                <Icon name="AlertTriangle" size={12} />
                                Регион с таким названием уже существует
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Базовая комиссия (₽) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Например, 1000"
                            value={editingRegion.base_comission}
                            onChange={(e) => setEditingRegion({ ...editingRegion, base_comission: e.target.value })}
                            className="w-full h-9 px-3 border border-gray-300 rounded-md text-[12px] nav-transition focus:border-yellow-400 focus:outline-none"
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                            Коэффициент (rate) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="1.0"
                            value={editingRegion.rate}
                            onChange={(e) => setEditingRegion({ ...editingRegion, rate: e.target.value })}
                            className="w-full h-9 px-3 border border-gray-300 rounded-md text-[12px] nav-transition focus:border-yellow-400 focus:outline-none"
                            disabled={saving}
                        />
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-2 border border-red-300 bg-red-50 rounded-md">
                            <Icon name="AlertTriangle" size={14} className="text-red-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-red-700">{error}</p>
                        </div>
                    )}

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
                            disabled={saving || editedRegionExists}
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

export const DeleteRegionModal = ({
    show,
    onClose,
    deletingRegion,
    deleting,
    onDelete
}) => {
    if (!show || !deletingRegion) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !deleting && onClose()}></div>
            <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <Icon name="AlertTriangle" size={16} className="text-red-500" />
                        Удалить регион?
                    </h2>
                    <button
                        onClick={() => !deleting && onClose()}
                        className="text-gray-400 hover:text-gray-600 nav-transition"
                        disabled={deleting}
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
                        onClick={onClose}
                        disabled={deleting}
                        className="px-4 h-9 rounded-md border border-gray-300 text-gray-600 text-[12px] font-medium hover:border-gray-400 nav-transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={deleting}
                        className="px-4 h-9 rounded-md bg-red-500 text-white text-[12px] font-medium flex items-center gap-1 hover:bg-red-600 nav-transition disabled:opacity-60 disabled:cursor-wait"
                    >
                        {deleting ? (
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
    );
};
