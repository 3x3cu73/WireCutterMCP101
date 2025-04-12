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
                tolerance: 5,   // Slightly reduced tolerance
            },
        }),
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
            <Navigation activity={[true, false, false, false]}/>
            <BeautifulStatusDisplay />
            <button type="button"
                    onClick={refreshData} className="w-28 m-3  border border-white bg-green-500 hover:border hover:border-green-600 text-white font-bold py-2 px-4 rounded"> Refresh
            </button>

            <button onClick={openNewModal} type="button" className="w-28 m-3  border border-white bg-blue-500 hover:border hover:border-blue-600 text-white font-bold py-2 px-4 rounded">
                New Job
            </button>
            {isNewModalOpen && (
                <Modal title="Create Job" onClose={closeNewModal}>
                    <CreateJob closeNewModal={closeNewModal}/>
                </Modal>
            )}

            <div className=" p-4 relative">
                <div className="  w-full h-full flex items-center justify-center bg-white bg-opacity-75 z-10">
                    <DndContext
                        onDragEnd={handleDragEnd}
                        collisionDetection={closestCorners}
                        sensors={sensors}
                    >
                        <Column tasks={jsonData} openModal={openEditModal}/>

                        {isEditModalOpen && (
                            <Modal title={`Edit Task #${selectedTask.title}`} onClose={closeModal}>
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
            </div>
        </>
    );
};