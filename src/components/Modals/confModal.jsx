// src/components/Modals/ConfirmationModal.jsx (Example file path)

import React, {Fragment, useState} from 'react';
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
 * Displays content and provides "Confirm" and "Cancel" buttons.
 * The loading state of the "Confirm" button is controlled by the parent component.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Controls whether the modal is visible. **Required.**
 * @param {function} props.onClose - Function called when the modal should be closed (e.g., clicking backdrop, close button, or Cancel). **Required.**
 * @param {function} props.onConfirm - Function called *only* when the main confirmation button is clicked. This function is expected to be potentially asynchronous. **Required.**
 * @param {string} props.title - The title displayed in the modal header. **Required.**
 * @param {string} [props.confirmText='Confirm'] - Text for the confirmation button (e.g., "Delete", "Save").
 * @param {string} [props.confirmActioningText] - Optional text for the confirm button while the action (triggered by onConfirm) is in progress (e.g., "Deleting...", "Saving..."). Defaults to "Processing...".
 * @param {string} [props.cancelText='Cancel'] - Text for the cancellation button.
 * @param {'danger' | 'warning' | 'info' | 'success' | 'primary'} [props.confirmButtonStyle='danger'] - Style preset for the confirm button ('danger' = red, 'primary' = blue, etc.). Defaults to 'danger'.
 * @param {React.ReactNode} [props.children] - Custom content to display in the modal body (optional). If not provided, the `description` prop will be used.
 * @param {string} [props.description] - Default description text if `children` are not provided.
 * @param {boolean} [props.isConfirming=false] - Flag passed from the parent component, indicating whether the `onConfirm` action is currently executing (e.g., waiting for an API response). Controls the button's loading state and text. **Required** for loading state functionality.
 */
const ConfirmationModal = ({
                               show,
                               onClose,
                               onConfirm,
                               title,
                               children,
                               description,
                               confirmText = 'Confirm',
                               confirmActioningText, // Prop for text like "Deleting..."
                               cancelText = 'Cancel',
                               confirmButtonStyle = 'danger',
                               isConfirming = false, // This state is CONTROLLED BY THE PARENT
                           }) => {

    // --- Don't render anything if not visible ---

    const [isExecuting, setIsExecuting] = useState(false);

    if (!show) {
        return null;
    }

    // --- Determine Confirm Button Styling (based on props) ---
    let confirmButtonClasses = "inline-flex justify-center items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition duration-150 ease-in-out disabled:opacity-75 disabled:cursor-not-allowed";
    switch (confirmButtonStyle) {
        case 'primary': confirmButtonClasses += ` ${isConfirming ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`; break;
        case 'success': confirmButtonClasses += ` ${isConfirming ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`; break;
        case 'warning': confirmButtonClasses += ` ${isConfirming ? 'bg-yellow-400' : 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500'} text-gray-800 hover:text-black`; break;
        case 'info':    confirmButtonClasses += ` ${isConfirming ? 'bg-sky-400' : 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-500'}`; break;
        case 'danger':  default: confirmButtonClasses += ` ${isConfirming ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`; break;
    }

    // --- Determine Text for Confirm Button when Loading ---
    const buttonTextWhileConfirming = confirmActioningText || 'Processing...';

    const executeFunction = async () => {
        setIsExecuting(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error('Error executing confirmation function:', error);
        } finally {
            setIsExecuting(false);
            onClose(); // Close the modal after the action is completed
        }
    }

    // --- Render the Modal ---
    return (
        <Transition appear show={show} as={Fragment}>
            {/* Dialog handles accessibility */}
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <TransitionChild as={Fragment} {...backdropTransition}>
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" aria-hidden="true" />
                </TransitionChild>

                {/* Modal Centering Container */}
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4 overflow-y-auto">
                    <TransitionChild as={Fragment} {...panelTransition}>
                        {/* Modal Panel */}
                        <DialogPanel className="relative w-full max-w-md rounded-2xl bg-white/85 backdrop-blur-xl p-6 shadow-xl border border-gray-200/80">
                            {/* Header */}
                            <div className="flex items-start justify-between pb-3 border-b border-gray-300/80">
                                <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-800 flex items-center">
                                    {/* Optional Icon */}
                                    {confirmButtonStyle === 'danger' && <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-500 shrink-0" aria-hidden="true" />}
                                    {confirmButtonStyle === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500 shrink-0" aria-hidden="true" />}
                                    {title}
                                </DialogTitle>
                                {/* Close Button */}
                                <button type="button" onClick={onClose} className="-m-1.5 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1" aria-label="Close modal">
                                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </div>

                            {/* Body Content */}
                            <div className="mt-4 text-sm text-gray-600 space-y-3">
                                {children ? children : <p>{description || 'Are you sure?'}</p>}
                            </div>

                            {/* Footer with Buttons */}
                            <div className="mt-5 flex justify-end gap-3 pt-4 border-t border-gray-200/80">
                                {/* Cancel Button: Calls onClose passed from parent */}
                                <button type="button" onClick={onClose} className="rounded-lg bg-gray-100/80 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition duration-150 ease-in-out">
                                    {cancelText}
                                </button>
                                {/* Confirm Button: Calls onConfirm passed from parent */}
                                <button
                                    type="button"
                                    onClick={executeFunction} // Calls the parent's function (e.g., executeDelete)
                                    disabled={isExecuting} // Disabled state controlled by parent's isConfirming prop
                                    className={confirmButtonClasses} // Dynamic styles based on props
                                >
                                    {/* Button Content: Changes based on parent's isConfirming prop */}
                                    {isExecuting ? (
                                        <>
                                            {/* Loading Spinner */}
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            {/* Loading Text */}
                                            {buttonTextWhileConfirming}
                                        </>
                                    ) : (
                                        // Normal Text
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