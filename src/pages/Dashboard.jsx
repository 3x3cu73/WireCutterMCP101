import React, { useEffect, useState, Fragment } from "react"; // Added Fragment
import {
    DndContext,
    closestCorners,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    KeyboardSensor
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/20/solid';

// Import Components
import { Column } from "../components/jobList.jsx"; // Assuming jobList.jsx is styled
import Modal from "../components/Modals/modal.jsx";
import { EditTask } from "../components/EditTask.jsx";
import { CreateJob } from "../components/newJob.jsx";
import BeautifulStatusDisplay from "../components/statusController.jsx";
import Navigation from "../components/Navigation.jsx";

// Import Services
import { updateJobDetails } from "../services/updateJob.jsx";
import { fetchMCP101Data } from "../services/fetch.jsx";
import { updateJobRank } from "../services/updateRank.jsx";
// --- Make sure you have a delete service ---
// import { deleteTaskService } from '../services/deleteTask'; // Example import name

// --- Placeholder Delete Service (Replace with your actual implementation) ---
const deleteTaskService = async (taskId) => {
    // Replace with your actual API call logic to delete the task by ID
    console.log(`Simulating API call to delete task with ID: ${taskId}`);
    // Example using axios:
    // const response = await axios.delete(`https://vps.sumitsaw.tech/api/mcp101/${taskId}`); // Adjust URL as needed
    // return response.data;

    // Simulate network delay and potential failure
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate 0.5s delay
    if (Math.random() < 0.9) { // 90% success rate for simulation
        return Promise.resolve({ message: `Task ${taskId} deleted successfully (simulated)` });
    } else {
        return Promise.reject(new Error("Simulated network error during delete"));
    }
};
// --- End Placeholder Delete Service ---


export const Dashboard = () => {
    // State Variables
    const [jsonData, setJsonData] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [loading, setLoading] = useState(true); // For initial data load
    const [refreshing, setRefreshing] = useState(false); // For manual refresh clicks
    const [fetchError, setFetchError] = useState(null); // To store fetch/refresh errors

    // --- Hooks ---
    const location = useLocation();
    const activity = [
        location.pathname === '/',
        location.pathname === '/Team',
        // Add other paths as needed
        false,
        false
    ];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
        useSensor(TouchSensor, { /* activationConstraint: { delay: 100 } */ }), // TouchSensor delay might be tricky
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- Data Fetching and Rank Update Effects ---
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setFetchError(null);

        const fetchData = async () => {
            try {
                const data = await fetchMCP101Data();
                if (isMounted) {
                    setJsonData(data);
                    setFetchError(null);
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                if (isMounted) {
                    setFetchError("Could not load job data. Please try refreshing.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        const intervalId = setInterval(async () => {
            try {
                // Silently update data in the background
                const data = await fetchMCP101Data();
                if (isMounted) setJsonData(data);
            } catch (error) {
                console.error("Failed to fetch interval data:", error);
                // Optionally set a *different* state for minor background fetch errors
            }
        }, 5000); // Interval for background refresh

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []); // Runs only on mount

    useEffect(() => {
        // Update rank whenever jsonData changes (after fetch, drag, delete)
        if (jsonData.length === 0 || loading) return; // Don't update rank if empty or still loading initial

        const newRankOrder = jsonData.map((item, index) => ({
            jobRank: jsonData.length - index,
            jobid: item.jobid
        }));
        updateJobRank(newRankOrder).catch(error => console.error("Rank update failed:", error));
    }, [jsonData, loading]); // Depend on jsonData and loading state


    // --- Event Handlers ---
    const handleDragEnd = event => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setJsonData(prevItems => {
            const oldIndex = prevItems.findIndex(i => i.id === active.id);
            const newIndex = prevItems.findIndex(i => i.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return prevItems;
            return arrayMove(prevItems, oldIndex, newIndex); // Returns new array, triggers rank update effect
        });
    };

    const openEditModal = (task) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setSelectedTask(null);
        setIsEditModalOpen(false);
    };

    const openNewModal = () => {
        setIsNewModalOpen(true);
    };

    const closeNewModal = () => {
        setIsNewModalOpen(false);
    };

    const handDataUpdate = async (updatedTaskData) => {
        const originalJsonData = [...jsonData]; // Backup for rollback
        const index = originalJsonData.findIndex((task) => task.id === updatedTaskData.id);
        if (index === -1) return;

        // Optimistic UI Update
        const updatedArray = originalJsonData.map((task, i) =>
            i === index ? { ...task, ...updatedTaskData } : task
        );
        setJsonData(updatedArray);
        // closeEditModal();

        // API Call
        try {
            await updateJobDetails(updatedTaskData);
            // Success: Optional feedback
        } catch (error) {
            console.error("Failed to update job:", error);
            // Rollback UI
            setJsonData(originalJsonData);
            // Error Feedback: Open modal again? Show toast?
            // Re-open modal to show error or allow correction?
            // openEditModal(originalJsonData[index]); // Reopen with original data
            setFetchError(`Failed to save changes for job ${updatedTaskData.jobid}. Please try again.`); // Use general error state
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        setFetchError(null);
        try {
            const data = await fetchMCP101Data();
            setJsonData(data);
        } catch (error) {
            console.error("Refresh failed:", error);
            setFetchError("Refresh failed. Please try again.");
        } finally {
            setRefreshing(false);
        }
    };

    const handleDeleteTask = async (taskIdToDelete) => {
        // 1. Confirmation Dialog (Strongly Recommended!)
        const taskToDelete = jsonData.find(task => task.id === taskIdToDelete);
        const taskTitle = taskToDelete ? `"${taskToDelete.title}"` : "this task";
        if (!window.confirm(`Are you sure you want to delete ${taskTitle}?`)) {
            return; // Stop if user cancels
        }

        // 2. Optimistic UI Update
        const originalJsonData = [...jsonData];
        setJsonData(prevData => prevData.filter(task => task.id !== taskIdToDelete));

        // 3. Call Backend API
        try {
            await deleteTaskService(taskIdToDelete); // Use the imported service
            console.log(`Task ${taskIdToDelete} deleted successfully.`);
            // Optional: Show success toast
        } catch (error) {
            console.error(`Failed to delete task ${taskIdToDelete}:`, error);
            // 4. Rollback UI on Error
            setJsonData(originalJsonData);
            // Optional: Show error toast/message
            setFetchError(`Failed to delete task. Please try again.`);
        }
    };


    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-200 to-indigo-300">
            <Navigation activity={activity} />
            <BeautifulStatusDisplay />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Analytics />

                {/* Action Buttons Row */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <button
                        type="button"
                        onClick={refreshData}
                        disabled={refreshing || loading}
                        className={`inline-flex items-center justify-center gap-x-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100/50 ${
                            refreshing || loading
                                ? 'bg-green-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        }`}
                    >
                        {refreshing ? (
                            <>
                                <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <ArrowPathIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                                Refresh
                            </>
                        )}
                    </button>
                    <button
                        onClick={openNewModal}
                        type="button"
                        disabled={loading}
                        className={`inline-flex items-center gap-x-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100/50 ${
                            loading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                    >
                        <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                        New Job
                    </button>
                </div>

                {/* Loading / Error / Content Display */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-3 text-gray-700 font-medium">Loading Jobs...</span>
                    </div>
                ) : fetchError ? (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg relative text-center shadow-md" role="alert">
                        <strong className="font-bold block sm:inline">Error: </strong>
                        <span className="block sm:inline ml-1">{fetchError}</span>
                        {/* Optional: Add a dismiss button for the error */}
                        {/* <button onClick={() => setFetchError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                             <XMarkIcon className="h-5 w-5"/>
                         </button> */}
                    </div>
                ) : (
                    <div className={`relative transition-opacity duration-300 ${refreshing ? 'opacity-75' : 'opacity-100'}`}>
                        {/* Refreshing Overlay */}
                        {refreshing && (
                            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center pointer-events-none">
                                {/* Optional small spinner during refresh */}
                                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                        {/* Main Content Grid */}
                        <div className="w-full bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/80">
                            {jsonData.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Column 1 */}
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Job Queue 1</h2>
                                        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners} sensors={sensors}>
                                            <Column tasks={jsonData} openModal={openEditModal} deleteTask={handleDeleteTask} />
                                        </DndContext>
                                    </div>
                                    {/* Column 2 */}
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Job Queue 2</h2>
                                        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners} sensors={sensors}>
                                            <Column tasks={jsonData} openModal={openEditModal} deleteTask={handleDeleteTask} />
                                        </DndContext>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    No jobs found. Click "New Job" to add one.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modals */}
                {isNewModalOpen && (
                    <Modal title="Create New Job" onClose={closeNewModal} show={isNewModalOpen}>
                        <CreateJob closeNewModal={closeNewModal} refreshData={refreshData} />
                    </Modal>
                )}
                {isEditModalOpen && selectedTask && (
                    <Modal title={`Edit Job: ${selectedTask?.jobid || '...'}`} onClose={closeEditModal} show={isEditModalOpen}>
                        <EditTask task={selectedTask} handDataUpdate={handDataUpdate} />
                        {/* Footer with Cancel button */}
                        <div className="mt-6 flex justify-end border-t border-gray-200/80 pt-4">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                className="rounded-lg bg-gray-100/80 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200/80 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition duration-150 ease-in-out"
                            >
                                Cancel
                            </button>
                            {/* Note: The "Save" button logic is typically inside EditTask or triggered differently */}
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};

// Export default if this is the main export of the file
// export default Dashboard;