import React, { useState, useEffect } from 'react'; // <-- Import useState and useEffect here
// Import relevant icons (choose solid or outline)
import {
    TagIcon, // For Title
    ChatBubbleBottomCenterTextIcon, // For Description
    CubeIcon, // For Quantity
    ArrowsRightLeftIcon, // For Length
    ScissorsIcon // For Stripping
} from '@heroicons/react/24/outline'; // Or /20/solid

/**
 * Component to display and edit task details within a modal.
 * Uses controlled inputs for editing and updates parent onBlur if value changed.
 * Includes icons next to labels.
 *
 * @param {object} props - Component props.
 * @param {object} props.task - The task object being edited. Passed as a prop.
 * @param {function} props.handDataUpdate - Callback function to notify the parent of changes.
 */
export const EditTask = ({ task, handDataUpdate }) => {
    // --- State for Controlled Inputs ---
    // Local state holds the current values being edited in the form
    const [formData, setFormData] = useState(task);

    // --- Effect to Sync Local State with Prop ---
    // If the task prop from the parent changes (e.g., user edits a different task),
    // reset the local formData to match the new task.
    useEffect(() => {
        setFormData(task);
    }, [task]); // Dependency array ensures this runs when 'task' prop changes

    // --- Handlers ---
    // Handles changes for ALL controlled inputs
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: value
        }));
    };

    // Handles calling parent update when an input loses focus (onBlur)
    const handleBlurUpdate = (event) => {
        const { name, value } = event.target;
        // Compare the *current input value* with the *original task prop value*
        if (task && task[name] !== value) {
            console.log(`Value changed for ${name}. Original: "${task[name]}", New: "${value}". Updating parent.`);
            handDataUpdate(formData); // Pass entire current form data
        } else {
            console.log(`Value for ${name} did not change from original on blur.`);
        }
    };

    // Defensive check for task object
    if (!task) {
        return <div className="text-center text-gray-500 py-4">Loading task details...</div>;
    }

    // --- Render Logic ---
    return (
        <div className="space-y-5">
            {/* --- Display Fields (Read-only with Icons) --- */}
            <div>
                <label className="flex items-center text-xs font-medium text-gray-500 mb-0.5">
                    <TagIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" />
                    Title
                </label>
                <p className="text-sm text-gray-800 font-medium break-words pl-5">
                    {task.title || 'N/A'}
                </p>
            </div>
            <div>
                <label className="flex items-center text-xs font-medium text-gray-500 mb-0.5">
                    <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" />
                    Description
                </label>
                <p className="text-sm text-gray-700 leading-relaxed break-words pl-5">
                    {task.description || 'No description provided.'}
                </p>
            </div>

            {/* --- Input Fields (Editable with Icons & Labels) --- */}
            <div>
                <label htmlFor="quantity" className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <CubeIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" />
                    Quantity
                </label>
                <input
                    id="quantity"
                    name="a"
                    type="text"
                    value={formData.a ?? ''}
                    onChange={handleInputChange}
                    onBlur={handleBlurUpdate}
                    placeholder="e.g., 100"
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                    aria-label="Quantity"
                />
            </div>
            <div>
                <label htmlFor="length" className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <ArrowsRightLeftIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" />
                    Length
                </label>
                <input
                    id="length"
                    name="b"
                    type="text"
                    value={formData.b ?? ''}
                    onChange={handleInputChange}
                    onBlur={handleBlurUpdate}
                    placeholder="e.g., 50mm"
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                    aria-label="Length"
                />
            </div>
            <div>
                <label htmlFor="stripping" className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <ScissorsIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" />
                    Stripping
                </label>
                <input
                    id="stripping"
                    name="c"
                    type="text"
                    value={formData.c ?? ''}
                    onChange={handleInputChange}
                    onBlur={handleBlurUpdate}
                    placeholder="e.g., 5mm"
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                    aria-label="Stripping"
                />
            </div>
        </div>
    );
};

// export default EditTask; // If it's the only export