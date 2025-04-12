// src/components/Modals/ConfirmationModal.jsx (Example file path)

import React, { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // Icons for close and warning

// Define transition classes (can be reused or customized)
const backdropTransition = {
    enter: "ease-out duration-300",
    enterFrom: "opacity-0",
    enterTo: "opacity-100",
    leave: "ease-in duration-200",
    leaveFrom: "opacity-100",
    leaveTo: "opacity-0",
};

const panelTransition = {
    enter: "ease-out duration-300",
    enterFrom: "opacity-0 scale-95",
    enterTo: "opacity-100 scale-100",
    leave: "ease-in duration-200",
    leaveFrom: "opacity-100 scale-100",
    leaveTo: "opacity-0 scale-95",
};

/**
 * A reusable confirmation modal component.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Controls whether the modal is visible.
 * @param {function} props.onClose - Function to call when the modal should be closed (e.g., clicking backdrop, close button, or Cancel).
 * @param {function} props.onConfirm - Function to call when the confirmation button is clicked.
 * @param {string} props.title - The title displayed in the modal header.
 * @param {string} [props.confirmText='Confirm'] - Text for the confirmation button.
 * @param {string} [props.cancelText='Cancel'] - Text for the cancellation button.
 * @param {'danger' | 'warning' | 'info' | 'success' | 'primary'} [props.confirmButtonStyle='danger'] - Style preset for the confirm button ('danger' = red, 'primary' = blue, etc.).
 * @param {React.ReactNode} [props.children] - Custom content to display above the buttons (optional). If not provided, a default description prop can be used.
 * @param {string} [props.description] - Default description text if children are not provided.
 * @param {boolean} [props.isConfirming=false] - Optional flag to show a loading state on the confirm button.
 */
const ConfirmationModal = ({
                               show,
                               onClose,
                               onConfirm,
                               title,
                               children,
                               description,
                               confirmText = 'Confirm',
                               cancelText = 'Cancel',
                               confirmButtonStyle = 'danger', // Default to danger for confirmation
                               isConfirming = false, // Optional loading state for confirm button
                           }) => {

    if (!show) {
        return null;
    }

    // Determine confirm button styles based on the prop
    let confirmButtonClasses = "inline-flex justify-center items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition duration-150 ease-in-out disabled:opacity-75 disabled:cursor-not-allowed";

    switch (confirmButtonStyle) {
        case 'primary':
            confirmButtonClasses += ` ${isConfirming ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`;
            break;
        case 'success':
            confirmButtonClasses += ` ${isConfirming ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`;
            break;
        case 'warning':
            confirmButtonClasses += ` ${isConfirming ? 'bg-yellow-400' : 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500'} text-gray-800 hover:text-black`; // Warning often uses darker text
            break;
        case 'info':
            confirmButtonClasses += ` ${isConfirming ? 'bg-sky-400' : 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-500'}`;
            break;
        case 'danger':
        default:
            confirmButtonClasses += ` ${isConfirming ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`;
            break;
    }


    return (
        <Transition appear show={show} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <TransitionChild as={Fragment} {...backdropTransition}>
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" aria-hidden="true" />
                </TransitionChild>

                {/* Modal Content */}
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4 overflow-y-auto">
                    <TransitionChild as={Fragment} {...panelTransition}>
                        <DialogPanel className="relative w-full max-w-md rounded-2xl bg-white/85 backdrop-blur-xl p-6 shadow-xl border border-gray-200/80"> {/* Slightly smaller max-w */}
                            {/* Header */}
                            <div className="flex items-start justify-between pb-3 border-b border-gray-300/80">
                                <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-800 flex items-center">
                                    {/* Optional Icon based on style */}
                                    {confirmButtonStyle === 'danger' && <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-500" aria-hidden="true" />}
                                    {confirmButtonStyle === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" aria-hidden="true" />}
                                    {title}
                                </DialogTitle>
                                <button type="button" onClick={onClose} className="-m-1.5 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1" aria-label="Close modal">
                                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </div>

                            {/* Body Content */}
                            <div className="mt-4 text-sm text-gray-600 space-y-3">
                                {children ? children : <p>{description || 'Are you sure?'}</p>}
                            </div>

                            {/* Footer Buttons */}
                            <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-gray-200/80">
                                <button
                                    type="button"
                                    onClick={onClose} // Cancel button uses onClose
                                    className="rounded-lg bg-gray-100/80 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition duration-150 ease-in-out"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm} // Confirm button uses onConfirm
                                    disabled={isConfirming}
                                    className={confirmButtonClasses} // Apply dynamic classes
                                >
                                    {isConfirming ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        confirmText
                                    )}
                                </button>
                            </div>

                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ConfirmationModal;