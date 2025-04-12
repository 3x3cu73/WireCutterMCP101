import React, { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Define transition classes including LEAVE properties for exit animations
const backdropTransition = {
    enter: "ease-out duration-300",
    enterFrom: "opacity-0",
    enterTo: "opacity-100",
    // --- These handle the backdrop fading out ---
    leave: "ease-in duration-200",      // Duration and easing for exit
    leaveFrom: "opacity-100",           // Starting state for exit
    leaveTo: "opacity-0",               // Ending state for exit
};

const panelTransition = {
    enter: "ease-out duration-300",
    enterFrom: "opacity-0 scale-95",
    enterTo: "opacity-100 scale-100",
    // --- These handle the panel scaling and fading out ---
    leave: "ease-in duration-200",      // Duration and easing for exit
    leaveFrom: "opacity-100 scale-100", // Starting state for exit
    leaveTo: "opacity-0 scale-95",      // Ending state for exit
};

const Modal = ({ title, show, onClose, children }) => {

    if (!show && !Transition.Child) { // Basic check, though Transition handles unmounting
        return null;
    }

    return (
        // Transition component manages enter/leave based on the 'show' prop
        <Transition appear show={show} as={Fragment}>
            {/* Dialog handles accessibility and closing logic */}
            <Dialog as="div" className="relative z-50" onClose={onClose}>

                {/* Backdrop Transition */}
                <TransitionChild
                    as={Fragment}
                    {...backdropTransition} // Applies enter AND leave transitions
                >
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" aria-hidden="true" />
                </TransitionChild>

                {/* Modal Container */}
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4 overflow-y-auto">

                    {/* Panel Transition */}
                        <TransitionChild
                            as={Fragment}
                            {...panelTransition} // Applies enter AND leave transitions
                        >
                            <DialogPanel className="relative w-full max-w-lg rounded-2xl bg-white/80 backdrop-blur-xl p-6 shadow-xl border border-gray-200/80">
                                {/* Header */}
                                <div className="flex items-start justify-between pb-4 border-b border-gray-300/80">
                                    {title && (
                                        <DialogTitle as="h3" className="text-xl font-semibold leading-6 text-gray-800">
                                            {title}
                                        </DialogTitle>
                                    )}
                                    <button
                                        type="button"
                                        onClick={onClose} // This triggers the parent to set show=false
                                        className="-mt-1 -mr-1 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-400/20 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors duration-150"
                                        aria-label="Close modal"
                                    >
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>

                                {/* Content Area */}
                                <div className="mt-5">
                                    {children}
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                </div>
            </Dialog>
        </Transition>
    );
};

export default Modal;