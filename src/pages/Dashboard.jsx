import React, { useEffect, useState } from "react";
import {
    DndContext,
    closestCorners,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    KeyboardSensor
} from "@dnd-kit/core";
import { Column } from "../components/jobList.jsx";
import Navigation from "../components/Navigation.jsx";
import {arrayMove, sortableKeyboardCoordinates} from "@dnd-kit/sortable";
import Modal from "../components/Modals/modal.jsx";
import { EditTask } from "../components/EditTask.jsx";
import { updateJobDetails } from "../services/updateJob.jsx";
import { fetchMCP101Data } from "../services/fetch.jsx";
import { CreateJob } from "../components/newJob.jsx";
import { updateJobRank } from "../services/updateRank.jsx";
import BeautifulStatusDisplay from "../components/statusController.jsx";
import {Analytics} from "@vercel/analytics/react";

export const Dashboard = () => {
    const [jsonData, setJsonData] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);

    const openNewModal = () => {
        setIsNewModalOpen(true);
    };

    // Configure sensors for both pointer and touch inputs
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 100, // Slightly reduced delay
                tolerance: 5,   // Slightly reduced tolerance
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100, // Slightly reduced delay
                // tolerance: 5,   // Slightly reduced tolerance
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter:sortableKeyboardCoordinates
        })
    );

    useEffect(() => {
        fetchMCP101Data().then((r) => setJsonData(r));

        const intervalId = setInterval(() => {
            fetchMCP101Data().then((data) => setJsonData(data));
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        console.log("jsonData updated:", jsonData);
        const newRankOrder = [];
        const jsonLength = jsonData.length;
        for (let i = 0; i < jsonLength; i++) {
            newRankOrder.push({ "jobRank": jsonLength - i, "jobid": jsonData[i].jobid });
        }
        console.log("Ranks:", newRankOrder);
        updateJobRank(newRankOrder).then(() => null);
    }, [jsonData]);

    const handleDragEnd = event => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setJsonData(prevItems => {
            const oldIndex = prevItems.findIndex(i => i.id === active.id);
            const newIndex = prevItems.findIndex(i => i.id === over.id);
            return arrayMove(prevItems, oldIndex, newIndex);
        });
    };

    const openEditModal = (task) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    };

    const closeModal = () => {
        setSelectedTask(null);
        setIsEditModalOpen(false);
    };

    const handDataUpdate = async (updatedTask) => {
        const updatedArray = structuredClone(jsonData);
        const index = jsonData.findIndex((task) => task.id === updatedTask.id);
        updatedArray[index] = { ...updatedArray[index], ...updatedTask };

        try {
            const result = await updateJobDetails(updatedTask);
            console.log("Update successful:", result);
            setJsonData(updatedArray);
        } catch (error) {
            console.error("Failed to update job:", error);
        }
    };

    const refreshData = async () => {
        fetchMCP101Data().then((r) => setJsonData(r));
    };

    const closeNewModal = () => {
        setIsNewModalOpen(false);
    };

    return (
        <>
            {/* Analytics might belong inside the main content or outside, depending on your needs */}
            {/* <Analytics /> */}

            {/* Assume Navigation might be a fixed/sticky header */}
            <Navigation activity={[true, false, false, false]}/>
            <BeautifulStatusDisplay />


            {/* ===== Main Content Area Wrapper ===== */}
            {/* Add 'pt-16' (or your navbar's height) IF <Navigation> is fixed/sticky */}
            {/* Remove 'pt-16' if <Navigation> is part of the normal document flow */}
            <main className="pt-16"> {/* Adjust or remove pt-16 based on Navigation behavior */}

                {/* Container to constrain width and center content */}
                {/* max-w-7xl limits width, mx-auto centers it, px-* adds side padding */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> {/* Adjust max-w-* as needed */}

                    {/* Place components that belong in the main centered content area here */}
                    <Analytics /> {/* Moved inside the constrained area */}

                    {/* Container for buttons for better spacing/layout */}
                    <div className="mb-6 flex flex-wrap items-center gap-3"> {/* Added mb-6 for space below buttons */}
                        <button
                            type="button"
                            onClick={refreshData}
                            className="border border-transparent bg-green-500 hover:bg-green-600 hover:border-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                            Refresh
                        </button>

                        <button
                            onClick={openNewModal}
                            type="button"
                            className="border border-transparent bg-blue-500 hover:bg-blue-600 hover:border-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                            New Job
                        </button>
                    </div>

                    {/* New Job Modal */}
                    {isNewModalOpen && (
                        <Modal title="Create Job" onClose={closeNewModal}>
                            <CreateJob closeNewModal={closeNewModal}/>
                        </Modal>
                    )}

                    {/* DnD Section Container */}
                    {/* Removed h-full, flex items-center justify-center as the parent (.max-w-7xl) now controls centering/padding */}
                    <div className="w-full bg-white bg-opacity-75 z-10 p-4 rounded-lg shadow"> {/* Optional: added rounding/shadow */}

                        {/* Grid container - It will now respect the parent's max-width */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* --- First DND Region --- */}
                            {/* Added min-w-0 to allow shrinking below content size if needed */}
                            <div className="min-w-0">
                                <DndContext
                                    onDragEnd={handleDragEnd} // Remember: Separate handlers/state if independent
                                    collisionDetection={closestCorners}
                                    sensors={sensors}
                                >
                                    <Column tasks={jsonData} openModal={openEditModal}/>

                                    {/* Edit Task Modal 1 (Needs independent state if applicable) */}
                                    {isEditModalOpen && (
                                        <Modal title={`Edit Task #${selectedTask?.title}`} onClose={closeModal}>
                                            <EditTask task={selectedTask} handDataUpdate={handDataUpdate}/>
                                            <div className="mt-8 flex justify-end space-x-3">
                                                <button
                                                    onClick={closeModal}
                                                    className="px-5 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </Modal>
                                    )}
                                </DndContext>
                            </div>

                            {/* --- Second DND Region --- */}
                            {/* Added min-w-0 */}
                            <div className="min-w-0">
                                <DndContext
                                    onDragEnd={handleDragEnd} // Needs handleDragEnd2 if independent
                                    collisionDetection={closestCorners}
                                    sensors={sensors}
                                >
                                    {/* Needs jsonData2, openEditModal2 if independent */}
                                    <Column tasks={jsonData} openModal={openEditModal}/>

                                    {/* Edit Task Modal 2 (Needs independent state: isEditModalOpen2, selectedTask2 etc.) */}
                                    {isEditModalOpen && (
                                        <Modal title={`Edit Task #${selectedTask?.title}`} onClose={closeModal}>
                                            <EditTask task={selectedTask} handDataUpdate={handDataUpdate}/>
                                            <div className="mt-8 flex justify-end space-x-3">
                                                <button
                                                    onClick={closeModal} // Needs closeModal2 if independent
                                                    className="px-5 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </Modal>
                                    )}
                                </DndContext>
                            </div>

                        </div> {/* End Grid */}
                    </div> {/* End DnD Section Container */}

                </div> {/* ===== End Constrained Container ===== */}
            </main> {/* ===== End Main Content Area ===== */}

            {/* Removed the outer <div className="relative"> unless specifically needed for absolute positioning of children relative to the entire page */}
        </>
    );
};