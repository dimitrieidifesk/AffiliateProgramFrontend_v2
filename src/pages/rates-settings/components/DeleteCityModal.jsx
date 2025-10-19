import React from 'react';
import Icon from 'components/AppIcon';

const DeleteCityModal = ({
    show,
    onClose,
    deletingCity,
    deleting,
    onDelete
}) => {
    if (!show || !deletingCity) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !deleting && onClose()}></div>
            <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <Icon name="AlertTriangle" size={16} className="text-red-500" />
                        Удалить город?
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
                    Вы уверены, что хотите удалить город <strong>{deletingCity.city}</strong>? 
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

export default DeleteCityModal;
