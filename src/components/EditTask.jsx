import React from "react"; // useState might be needed if converting to controlled inputs

export const EditTask = ({ task, handDataUpdate }) => {

    // Handles changes on input blur
    const handleChange = (event) => {
        const { name, value } = event.target;

        // Only update if the value has actually changed
        // Note: Comparing defaultValue with current value directly in onBlur can be tricky
        // This comparison might trigger even if visually the same if types differ slightly.
        // A controlled component approach (value + onChange) is generally more robust.
        if (task[name] !== value) { // Basic check
            const updatedTaskData = {
                ...task, // Spread existing task data
                [name]: value // Update the specific field that changed
            };
            // console.log("Updating task with:", updatedTaskData); // For debugging
            handDataUpdate(updatedTaskData); // Pass the *entire updated task object*
        }
    };

    // Defensive check for task object
    if (!task) {
        return <div className="text-center text-gray-500 py-4">Loading task details...</div>;
    }

    return (
        // Removed outer container, assuming Modal provides padding
        // Use space-y-5 for slightly more spacing
        <div className="space-y-5">

            {/* Display Fields (Title, Description) - Keep these readable */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                <p className="text-sm text-gray-800 font-medium">{task.title || 'N/A'}</p>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <p className="text-sm text-gray-700 leading-relaxed">{task.description || 'No description provided.'}</p>
            </div>

            {/* Input Fields - Apply Modern Styling */}
            {/* Quantity Input */}
            <div>
                {/* Optional: Add a small label above if placeholder isn't enough */}
                {/* <label htmlFor="quantity" className="block text-xs font-medium text-gray-500 mb-1">Quantity</label> */}
                <input
                    id="quantity" // Add id for potential label association
                    name="a" // Matches the key in the task object
                    type="text" // Use text or number (consider validation if number)
                    defaultValue={task.a ?? ''} // Use defaultValue with onBlur, provide fallback ''
                    onBlur={handleChange}
                    placeholder="Quantity (e.g., 100)" // Descriptive Placeholder
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                />
            </div>

            {/* Length Input */}
            <div>
                {/* <label htmlFor="length" className="block text-xs font-medium text-gray-500 mb-1">Length</label> */}
                <input
                    id="length"
                    name="b" // Matches the key in the task object
                    type="text"
                    defaultValue={task.b ?? ''}
                    onBlur={handleChange}
                    placeholder="Length (e.g., 50mm)" // Descriptive Placeholder
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                />
            </div>

            {/* Stripping Input */}
            <div>
                {/* <label htmlFor="stripping" className="block text-xs font-medium text-gray-500 mb-1">Stripping</label> */}
                <input
                    id="stripping"
                    name="c" // Matches the key in the task object
                    type="text"
                    defaultValue={task.c ?? ''}
                    onBlur={handleChange}
                    placeholder="Stripping (e.g., 5mm)" // Descriptive Placeholder
                    className="block w-full px-3 py-2 text-gray-700 bg-white/80 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition duration-150 ease-in-out"
                />
            </div>

            {/*
              IMPORTANT: The "Save" or "Update" button should typically be part of the Modal's footer
              controlled by the parent component (Dashboard.jsx in this case), not directly inside EditTask.
              The parent would trigger the actual save action, possibly using the latest state managed via handDataUpdate.
              If you need a button *here*, you would add it below, styled like the primary action buttons.
             */}
            {/* Example:
             <button
                 type="button" // Or 'submit' if wrapped in a form
                 onClick={() => console.log("Explicit save clicked - potentially trigger parent action")}
                 className="w-full mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
             >
                 Save Changes (Example Button)
             </button>
             */}

        </div>
    );
};