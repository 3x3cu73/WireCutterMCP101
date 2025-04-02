import React, { useEffect, useState } from "react";
import { DndContext, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Column } from "../components/jobList.jsx";
import Navigation from "../components/Navigation.jsx";
import { arrayMove } from "@dnd-kit/sortable";
import Modal from "../components/Modals/modal.jsx";
import {EditTask} from "../components/EditTask.jsx";
import {updateJobDetails} from "../services/updateJob.jsx";
import {fetchMCP101Data} from "../services/fetch.jsx";



export const Dashboard = () => {
    const [jsonData, setJsonData] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Configure sensors for both pointer and touch inputs
    const sensors = useSensors(
        useSensor(PointerSensor,{
            activationConstraint: {
                delay: 130, // Increase delay to avoid accidental drags
                tolerance: 10, // Increase tolerance for better touch detection
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 130, // Increase delay to avoid accidental drags
                tolerance: 10, // Increase tolerance for better touch detection
            },
        }),
    );

    useEffect(() => {
        fetchMCP101Data().then((r) => setJsonData(r))
    }, []);



    const handleDragEnd = event => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setJsonData(items => {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    };

    const openModal = (task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedTask(null);
        setIsModalOpen(false);
    };

    console.log(jsonData);

    const handDataUpdate = async (updatedTask) => {
        // setJsonData(data);


        // Create a shallow copy of the array
        const updatedArray = structuredClone(jsonData);


        const index = jsonData.findIndex((task) => task.id === updatedTask.id);
        // Update the specific index with new data
        updatedArray[index] = {...updatedArray[index], ...updatedTask};

        // Set the updated array in state


        try {
            const result = await updateJobDetails(updatedTask);
            console.log("Update successful:", result);
            setJsonData(updatedArray);
        } catch (error) {
            console.error("Failed to update job:", error);
        }
    }

    const refreshData = async () => {

        fetchMCP101Data().then((r) => setJsonData(r))

    }

    return (
        <>
            <Navigation activity={[true, false, false, false]}/>
            <button type="button"
                    onClick={refreshData} className="w-28 m-3  bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"> Default
            </button>

            <DndContext
                onDragEnd={handleDragEnd}
                collisionDetection={closestCorners}
                sensors={sensors} // Add sensors prop
            >
                <Column tasks={jsonData} openModal={openModal}/>

                {isModalOpen && (
                    <Modal ModalEdit task={selectedTask} onClose={closeModal}>
                        {/*<p>working</p>*/}
                        <EditTask task={selectedTask} handDataUpdate={handDataUpdate}/>
                        {/* Footer */}
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

        </>
    );
};
