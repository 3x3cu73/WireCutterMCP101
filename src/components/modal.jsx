import React from "react";

const Modal = ({ task, onClose }) => {
    if (!task) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-opacity-30 backdrop-blur-[2px] flex justify-center items-center z-50 transition-opacity"
            onClick={handleBackdropClick}
        >
            <div className="relative bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-lg mx-4 p-8 animate-scale-in">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-800">Task Details #{task.id}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="mt-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Title</label>
                        <p className="mt-1 text-gray-900 font-[500]">{task.title}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="mt-1 text-gray-700 leading-relaxed">{task.description}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                        Close
                    </button>
                    <button
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
