import React from "react";

const Modal = ({ task, onClose }) => {
    if (!task) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            {/* Modal Container */}
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-fade-in">
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Edit Task #{task.id}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Content */}
                <div className="mt-4">
                    <p className="text-gray-700">
                        <strong>Title:</strong> {task.title}
                    </p>
                    <p className="text-gray-700 mt-2">
                        <strong>Description:</strong> {task.description}
                    </p>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end mt-6 space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring focus:ring-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring focus:ring-blue-300"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
