import React, { useEffect, useState } from "react";
import { DndContext, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Column } from "../components/jobList.jsx";
import Navigation from "../components/Navigation.jsx";
import { arrayMove } from "@dnd-kit/sortable";
import Modal from "../components/Modals/modal.jsx";
import {EditTask} from "../components/EditTask.jsx";
import {updateJobDetails} from "../services/updateJob.jsx";
import {fetchMCP101Data} from "../services/fetch.jsx";
import {CreateJob} from "../components/newJob.jsx";



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

        // Fetch data initially and then set up an interval
        const intervalId = setInterval(() => {
            fetchMCP101Data().then((data) => setJsonData(data));
        }, 2000); // 10 seconds

        // Clean up the interval on component unmount
        return () => clearInterval(intervalId);
    }, []); // Empty dependency array ensures this runs only once on mount

    const handleDragEnd = event => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setJsonData(items => {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
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


    const closeNewModal = () => {
        // setSelectedTask(null);
        setIsNewModalOpen(false);
    };

    return (
        <>
            <Navigation activity={[true, false, false, false]}/>
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
            )

            }



            <DndContext
                onDragEnd={handleDragEnd}
                collisionDetection={closestCorners}
                sensors={sensors} // Add sensors prop
            >
                <Column tasks={jsonData} openModal={openEditModal}/>

                {isEditModalOpen && (
                    <Modal  title={"Edit Task #"+selectedTask.title} onClose={closeModal}>
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
