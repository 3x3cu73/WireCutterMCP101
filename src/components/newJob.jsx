import React, { useState } from "react";
import axios from "axios";
// Import icons (ensure these are available in your project)
import {
    TagIcon, ChatBubbleBottomCenterTextIcon, CubeIcon, ArrowsRightLeftIcon, ScissorsIcon
} from '@heroicons/react/24/outline'; // Or /20/solid

// Default state for a new job
const initialJobState = {
    user: "test", title: "", description: "", a: "", b: "", c: "",
};

export const CreateJob = ({ closeNewModal, refreshData }) => {
    const [task, setTask] = useState(initialJobState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Use onChange for controlled components
    const handleChange = (event) => {
        const { name, value } = event.target;
        setTask(prevTask => ({ ...prevTask, [name]: value }));
        if (error) setError(null); // Clear error on typing
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        console.log("CreateJob: handleSubmit triggered.");

        // Frontend Validation
        if (!task.title || !task.a || !task.b || !task.c) {
            const errMsg = "Please fill in Title, Quantity, Length, and Stripping fields.";
            console.warn("CreateJob: Validation failed.", errMsg);
            setError(errMsg);
            setIsLoading(false);
            return;
        }

        // --- Sending the raw 'task' state ---
        // Assuming the API can handle string values for a, b, c,
        // or that the previous working version functioned this way.
        console.log("CreateJob: Data state being sent:", JSON.stringify(task, null, 2));
        // --- End Data ---

        const url = `https://vps.sumitsaw.tech/api/mcp101`; // Verify this URL!
        console.log("CreateJob: Attempting POST to:", url);

        try {
            // --- Using direct axios.post ---
            const response = await axios.post(url, task, { // Sending 'task' directly
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    // Add Authorization header if needed
                },
            });
            // --- End axios.post ---

            console.log("CreateJob: API Success Response Status:", response.status);
            console.log("CreateJob: API Success Response Data:", response.data);

            setTask(initialJobState); // Reset form

            if (refreshData) {
                console.log("CreateJob: Calling refreshData...");
                refreshData(); // Call refreshData passed from parent
            } else {
                console.warn("CreateJob: refreshData prop is missing!");
            }

            closeNewModal(); // Close the modal
            console.log("CreateJob: Modal closed.");

        } catch (err) {
            console.error("CreateJob: Error during API call:", err); // Log the full error

            let errorMessage = "Failed to create job. Please try again.";
            if (err.response) {
                console.error("CreateJob: Server Response Error Data:", err.response.data);
                console.error("CreateJob: Server Response Error Status:", err.response.status);
                errorMessage = `API Error ${err.response.status}: ${err.response.data?.detail || JSON.stringify(err.response.data) || 'Check server logs.'}`;
            } else if (err.request) {
                console.error("CreateJob: No response received:", err.request);
                errorMessage = "No response from server. Check network or server status.";
            } else {
                console.error("CreateJob: Request setup error:", err.message);
                errorMessage = `Request error: ${err.message}`;
            }
            setError(errorMessage);

        } finally {
            console.log("CreateJob: Setting isLoading to false.");
            setIsLoading(false);
        }
    };

    // --- Render Logic with Labels and Icons ---
    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title Input */}
            <div>
                <label htmlFor="title" className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <TagIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" /> Job Title
                </label>
                <input id="title" name="title" type="text" value={task.title} onChange={handleChange} placeholder="e.g., Main Harness Assembly" required className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out" aria-label="Job Title" />
            </div>

            {/* Description Input */}
            <div>
                <label htmlFor="description" className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" /> Description
                </label>
                <input id="description" name="description" type="text" value={task.description} onChange={handleChange} placeholder="(Optional)" className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out" aria-label="Description" />
            </div>

            {/* Quantity Input */}
            <div>
                <label htmlFor="quantity" className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <CubeIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" /> Quantity
                </label>
                <input id="quantity" name="a" type="number" value={task.a} onChange={handleChange} placeholder="e.g., 100" required min="1" className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out" aria-label="Quantity" />
            </div>

            {/* Length Input */}
            <div>
                <label htmlFor="length" className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <ArrowsRightLeftIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" /> Length
                </label>
                <input id="length" name="b" type="text" value={task.b} onChange={handleChange} placeholder="e.g., 50mm" required className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out" aria-label="Length" />
            </div>

            {/* Stripping Input */}
            <div>
                <label htmlFor="stripping" className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <ScissorsIcon className="h-4 w-4 mr-1.5 text-gray-400" aria-hidden="true" /> Stripping
                </label>
                <input id="stripping" name="c" type="text" value={task.c} onChange={handleChange} placeholder="e.g., 5mm" required className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out" aria-label="Stripping" />
            </div>

            {/* Error Message Display */}
            {error && (
                <div className="text-sm text-red-600 bg-red-100 border border-red-300 rounded-md p-2 text-center">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`inline-flex justify-center items-center rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100/50 ${
                        isLoading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                >
                    {isLoading ? ( /* Loading indicator */
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Creating...
                        </>
                    ) : ( 'Create Job' ) }
                </button>
            </div>
        </form>
    );
};

// export default CreateJob;