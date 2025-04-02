import React, { useEffect, useState } from "react";
import { DndContext, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Column } from "../components/jobList.jsx";
import Navigation from "../components/Navigation.jsx";
import { arrayMove } from "@dnd-kit/sortable";
import Modal from "../components/Modals/modal.jsx";
import {EditTask} from "../components/EditTask.jsx";
import {updateJobDetails} from "../services/updateJob.jsx";


export const Dashboard = () => {
    const [jsonData, setJsonData] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Configure sensors for both pointer and touch inputs
    const sensors = useSensors(
        useSensor(PointerSensor,{
            activationConstraint: {
                delay: 100, // Increase delay to avoid accidental drags
                tolerance: 10, // Increase tolerance for better touch detection
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100, // Increase delay to avoid accidental drags
                tolerance: 10, // Increase tolerance for better touch detection
            },
        }),
    );

    useEffect(() => {
        fetchData().then(() => null);
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('https://vps.sumitsaw.tech/api/mcp101');
            if (!response.ok)  new Error(`HTTP error! Status: ${response.status}`);

            const result = await response.json();
            setJsonData(result["jobs"].map((item) => ({
                jobid: item[0],
                id: item[1],
                status: item[2],
                user: item[3],
                a: item[4],
                b: item[5],
                c: item[6],
                timestamp: item[7],
                description: item[8],
                title: item[9]
            })));
        } catch (error) {
            console.log(error);
        }
    };

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


    return (
        <>
            <Navigation activity={[true, false, false, false]} />
            <DndContext
                onDragEnd={handleDragEnd}
                collisionDetection={closestCorners}
                sensors={sensors} // Add sensors prop
            >
                <Column tasks={jsonData} openModal={openModal} />

                {isModalOpen && (
                    <Modal ModalEdit task={selectedTask} onClose={closeModal} >
                        {/*<p>working</p>*/}
                        <EditTask task={selectedTask}  handDataUpdate={handDataUpdate} />
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
