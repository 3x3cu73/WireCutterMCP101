import React, { useState } from "react";
import axios from "axios";

// Default state for a new job
const initialJobState = {
    user: "test", // Keep default user or get dynamically if needed
    title: "",
    description: "",
    a: "", // Quantity
    b: "", // Length
    c: "", // Stripping
};

export const CreateJob = ({ closeNewModal, refreshData }) => { // Added refreshData prop
    const [task, setTask] = useState(initialJobState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Use onChange for controlled components
    const handleChange = (event) => {
        const { name, value } = event.target;
        setTask(prevTask => ({
            ...prevTask,
            [name]: value
        }));
        // Clear error when user starts typing again
        if (error) setError(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission
        setIsLoading(true);
        setError(null);

        // Basic validation (optional but recommended)
        if (!task.title || !task.a || !task.b || !task.c) {
            setError("Please fill in Title, Quantity, Length, and Stripping fields.");
            setIsLoading(false);
            return;
        }

        const url = `https://vps.sumitsaw.tech/api/mcp101`;

        try {
            const response = await axios.post(url, task, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            });
            console.log("Job Created:", response.data);
            setTask(initialJobState); // Reset form after successful creation
            if (refreshData) {
                refreshData(); // Call refreshData passed from parent
            }
            closeNewModal(); // Close the modal
            // No need to return response data here unless specifically needed by parent
        } catch (err) {
            console.error("Error creating job:", err.response?.data || err.message);
            setError(err.response?.data?.detail || "Failed to create job. Please try again.");
            // Keep modal open on error so user can see message/retry
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Use a form element for semantic structure and onSubmit handling
        <form onSubmit={handleSubmit} className="space-y-5"> {/* Adjusted spacing */}

            {/* Input Fields - Apply Modern Styling & Placeholders */}
            <div>
                <input
                    name="title"
                    type="text"
                    value={task.title} // Controlled input
                    onChange={handleChange}
                    placeholder="Job Title (e.g., Main Harness Assembly)" // Placeholder
                    required // Add basic HTML validation
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                />
            </div>

            <div>
                <input // Changed to input for consistency, could be textarea if needed
                    name="description"
                    type="text"
                    value={task.description} // Controlled input
                    onChange={handleChange}
                    placeholder="Description (Optional)" // Placeholder
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                />
            </div>

            <div>
                <input
                    name="a" // Quantity
                    type="number" // Use number type for quantity
                    value={task.a} // Controlled input
                    onChange={handleChange}
                    placeholder="Quantity (e.g., 100)" // Placeholder
                    required
                    min="1" // Example validation: minimum quantity
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                />
            </div>

            <div>
                <input
                    name="b" // Length
                    type="text" // Keep as text to allow units like 'mm'
                    value={task.b} // Controlled input
                    onChange={handleChange}
                    placeholder="Length (e.g., 50mm)" // Placeholder
                    required
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                />
            </div>

            <div>
                <input
                    name="c" // Stripping
                    type="text"
                    value={task.c} // Controlled input
                    onChange={handleChange}
                    placeholder="Stripping (e.g., 5mm)" // Placeholder
                    required
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                />
            </div>

            {/* Error Message Display */}
            {error && (
                <div className="text-sm text-red-600 bg-red-100 border border-red-300 rounded-md p-2 text-center">
                    {error}
                </div>
            )}


            {/* Submit Button - Styled as Primary Action */}
            {/* ---- MODIFIED ---- */}
            {/* This button now submits the form */}
            <div className="pt-4 flex justify-end"> {/* Added padding top and flex alignment */}
                <button
                    type="submit"
                    disabled={isLoading} // Disable button while loading
                    className={`inline-flex justify-center items-center rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100/50 ${
                        isLoading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                        </>
                    ) : (
                        'Create Job'
                    )}
                </button>
            </div>
        </form>
    );
};