import React, { useState } from "react";
import {EditTask} from "./EditTask.jsx";

const Modal = ({ task, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    if (!task) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            closeWithAnimation();
        }
    };

    const closeWithAnimation = () => {
        setIsExiting(true); // Trigger exit animation
        setTimeout(() => {
            onClose(); // Close the modal after animation ends
        }, 300); // Match the duration of the exit animation
    };

    return (
        <div
            className={`fixed inset-0 bg-opacity-30 backdrop-blur-[2px] flex justify-center items-center z-50 transition-opacity ${
                isExiting ? "animate-fade-out" : "animate-fade-in"
            }`}
            onClick={handleBackdropClick}
        >
            <div
                className={`relative bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-lg mx-4 p-8 ${
                    isExiting ? "animate-scale-out" : "animate-scale-in"
                }`}
            >
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-800">Task Details #{task.id}</h3>
                    <button
                        onClick={closeWithAnimation}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <EditTask task={task} />

                {/* Footer */}
                <div className="mt-8 flex justify-end space-x-3">
                    <button
                        onClick={closeWithAnimation}
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
