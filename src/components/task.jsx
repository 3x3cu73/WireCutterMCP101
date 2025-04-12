// src/components/Task.jsx
import React from 'react';
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
// Import Heroicons (adjust path based on solid/outline preference)
import { PencilSquareIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline'; // Or /20/solid
// Optional: Icons for details
// import { CubeIcon, ArrowsRightLeftIcon, ScissorsIcon } from '@heroicons/react/20/solid';

// Define the Task component
export const Task = ({ id, task, openModal, deleteTask }) => { // Added deleteTask prop
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    // Style for drag-and-drop transformations
    const style = {
        transition,
        // Apply transform only if it exists (prevents console warnings on initial render)
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        touchAction: 'none', // Necessary for touch devices compatibility with dnd-kit
        // Add visual feedback while dragging
        opacity: isDragging ? 0.7 : 1,
        boxShadow: isDragging ? '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1)' : undefined,
        zIndex: isDragging ? 10 : undefined, // Ensure dragging item is above others
    };

    // --- Modernized Card Styling ---
    const cardClassName = `
        relative group bg-white/70 backdrop-blur-md
        rounded-xl shadow-md border border-gray-200/60
        p-3 m-1 space-y-2
        transition-shadow duration-150 ease-in-out hover:shadow-lg
    `; // Added hover shadow

    // Prevent drag start when clicking buttons
    const stopPropagation = (e) => e.stopPropagation();

    // Handle delete click (basic implementation - requires confirmation in parent)
    const handleDeleteClick = (e) => {
        stopPropagation(e);
        // --- IMPORTANT ---
        // Add a confirmation dialog here in a real application before deleting!
        // Example: if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) { ... }
        console.log(`Requesting delete for task ID: ${id}`); // Log the ID being deleted
        deleteTask(id); // Call the passed delete function with the task's unique ID
    };

    // Handle edit click
    const handleEditClick = (e) => {
        stopPropagation(e);
        openModal(task);
    };

    // Defensive check
    if (!task) return null;

    return (
        <div ref={setNodeRef} style={style} className={cardClassName}>
            {/* Main Content Area */}
            <div className="flex items-start justify-between">
                {/* Task Title */}
                <h4 className="font-semibold text-sm text-gray-800 pr-2 break-words">
                    {task.title || 'Untitled Task'}
                </h4>
                {/* Drag Handle (optional, can apply listeners to whole card or just this) */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab text-gray-400 hover:text-gray-600 p-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Drag task"
                >
                    <Bars3Icon className="h-4 w-4" />
                </div>
            </div>

            {/* Task Details */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                {/* Quantity */}
                <span className="inline-flex items-center">
                    {/* Optional Icon: <CubeIcon className="h-3.5 w-3.5 mr-1 text-gray-400" /> */}
                    Qty: <strong className="ml-1 font-medium text-gray-800">{task.a ?? 'N/A'}</strong>
                </span>
                {/* Length */}
                <span className="inline-flex items-center">
                     {/* Optional Icon: <ArrowsRightLeftIcon className="h-3.5 w-3.5 mr-1 text-gray-400" /> */}
                    Length: <strong className="ml-1 font-medium text-gray-800">{task.b ?? 'N/A'}</strong>
                </span>
                {/* Stripping */}
                <span className="inline-flex items-center">
                    {/* Optional Icon: <ScissorsIcon className="h-3.5 w-3.5 mr-1 text-gray-400" /> */}
                    Stripping: <strong className="ml-1 font-medium text-gray-800">{task.c ?? 'N/A'}</strong>
                </span>
            </div>

            {/* Action Buttons - Appear on Hover */}
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {/* Edit Button */}
                <button
                    onClick={handleEditClick}
                    className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                    aria-label={`Edit task ${task.title || ''}`}
                    title="Edit Task" // Tooltip
                >
                    <PencilSquareIcon className="h-4 w-4" />
                </button>
                {/* Delete Button */}
                <button
                    onClick={handleDeleteClick}
                    className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                    aria-label={`Delete task ${task.title || ''}`}
                    title="Delete Task" // Tooltip
                >
                    <TrashIcon className="h-4 w-4" />

                </button>
            </div>
        </div>
    );
};