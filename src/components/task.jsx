import React, { useState } from 'react';
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { PencilSquareIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { deleteTask } from "../services/deleteTask.jsx";
import ConfirmationModal from "./Modals/confModal.jsx";

export const Task = ({ id, task, openModal }) => {
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transition,
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        touchAction: 'none',
        opacity: isDragging ? 0.7 : 1,
        boxShadow: isDragging ? '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1)' : undefined,
        zIndex: isDragging ? 10 : undefined,
    };

    const cardClassName = `
        relative group bg-white/70 backdrop-blur-md
        rounded-xl shadow-md border border-gray-200/60
        p-3 m-1 space-y-2
        transition-shadow duration-150 ease-in-out hover:shadow-lg
    `;

    const stopPropagation = (e) => e.stopPropagation();

    const handleEditClick = (e) => {
        stopPropagation(e);
        openModal(task);
    };

    const handleDeleteClick = () => {
        setIsConfirmDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteTask(task);
            console.log(`Task ${task.title} deleted successfully.`);
        } catch (error) {
            console.error("Error deleting task:", error);
        } finally {
            setIsConfirmDeleteModalOpen(false);
        }
    };

    const handleCloseModal = () => {
        setIsConfirmDeleteModalOpen(false);
    };

    if (!task) return null;

    return (
        <>
            <ConfirmationModal
                show={isConfirmDeleteModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                confirmText="Delete Task"
                confirmButtonStyle="danger"
            >
                <p>
                    Are you sure you want to delete the task:
                    <strong className="ml-1 font-medium text-gray-800">
                        {task.title}
                    </strong>?
                </p>
                <p className="mt-2 text-xs text-gray-500">This action cannot be undone.</p>
            </ConfirmationModal>
            <div ref={setNodeRef} style={style} className={cardClassName}>
                <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm text-gray-800 pr-2 break-words">
                        {task.title || 'Untitled Task'}
                    </h4>
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-gray-400 hover:text-gray-600 p-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Drag task"
                    >
                        <Bars3Icon className="h-4 w-4" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span className="inline-flex items-center">
                        Qty: <strong className="ml-1 font-medium text-gray-800">{task.a ?? 'N/A'}</strong>
                    </span>
                    <span className="inline-flex items-center">
                        Length: <strong className="ml-1 font-medium text-gray-800">{task.b ?? 'N/A'}</strong>
                    </span>
                    <span className="inline-flex items-center">
                        Stripping: <strong className="ml-1 font-medium text-gray-800">{task.c ?? 'N/A'}</strong>
                    </span>
                </div>
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                        onClick={handleEditClick}
                        className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                        aria-label={`Edit task ${task.title || ''}`}
                        title="Edit Task"
                    >
                        <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                        aria-label={`Delete task ${task.title || ''}`}
                        title="Delete Task"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </>
    );
};