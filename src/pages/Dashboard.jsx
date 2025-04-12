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
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Modal from "../components/Modals/modal.jsx";
import { EditTask } from "../components/EditTask.jsx";
import { updateJobDetails } from "../services/updateJob.jsx";
import { fetchMCP101Data } from "../services/fetch.jsx";
import { CreateJob } from "../components/newJob.jsx";
import { updateJobRank } from "../services/updateRank.jsx";
import BeautifulStatusDisplay from "../components/statusController.jsx";
import { Analytics } from "@vercel/analytics/react";
import Navigation from "../components/Navigation.jsx";
import { useLocation } from "react-router-dom";

export const Dashboard = () => {
    const [jsonData, setJsonData] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);

    const openNewModal = () => {
        setIsNewModalOpen(true);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { delay: 100, tolerance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 100 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
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
        if (jsonData.length === 0) return;
        const newRankOrder = jsonData.map((item, index) => ({
            jobRank: jsonData.length - index,
            jobid: item.jobid
        }));
        updateJobRank(newRankOrder).catch(error => console.error("Rank update failed:", error));
    }, [jsonData]);

    const handleDragEnd = event => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setJsonData(prevItems => {
            const oldIndex = prevItems.findIndex(i => i.id === active.id);
            const newIndex = prevItems.findIndex(i => i.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return prevItems;
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
        const index = updatedArray.findIndex((task) => task.id === updatedTask.id);
        if (index === -1) return;

        updatedArray[index] = { ...updatedArray[index], ...updatedTask };

        try {
            const result = await updateJobDetails(updatedTask);
            setJsonData(updatedArray);
            closeModal();
        } catch (error) {
            console.error("Failed to update job:", error);
        }
    };

    const refreshData = async () => {
        fetchMCP101Data().then((r) => setJsonData(r)).catch(error => console.error("Refresh failed:", error));
    };

    const closeNewModal = () => {
        setIsNewModalOpen(false);
    };

    const location = useLocation();
    const activity = [
        location.pathname === '/',
        location.pathname === '/Team',
        location.pathname === '/Projects',
        location.pathname === '/Calendar'
    ];

    return (
        <>
            <Navigation activity={activity} />
            <BeautifulStatusDisplay />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Analytics />
                <div className="mb-6 flex flex-wrap items-center gap-3">
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

                {isNewModalOpen && (
                    <Modal title="Create Job" onClose={closeNewModal}>
                        <CreateJob closeNewModal={closeNewModal} refreshData={refreshData} />
                    </Modal>
                )}

                <div className="w-full bg-white bg-opacity-75 z-10 p-4 rounded-lg shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="min-w-0">
                            <DndContext
                                onDragEnd={handleDragEnd}
                                collisionDetection={closestCorners}
                                sensors={sensors}
                            >
                                <h2 className="text-lg font-semibold mb-3 text-gray-700">Job List 1</h2>
                                <Column tasks={jsonData} openModal={openEditModal} />
                            </DndContext>
                        </div>
                        <div className="min-w-0">
                            <DndContext
                                onDragEnd={handleDragEnd}
                                collisionDetection={closestCorners}
                                sensors={sensors}
                            >
                                <h2 className="text-lg font-semibold mb-3 text-gray-700">Job List 2</h2>
                                <Column tasks={jsonData} openModal={openEditModal} />
                            </DndContext>
                        </div>
                    </div>
                </div>

                {isEditModalOpen && selectedTask && (
                    <Modal title={`Edit Job: ${selectedTask?.jobid || 'Loading...'}`} onClose={closeModal}>
                        <EditTask task={selectedTask} handDataUpdate={handDataUpdate} />
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
            </div>
        </>
    );
};