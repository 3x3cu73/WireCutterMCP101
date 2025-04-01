import React, { useEffect, useState } from "react";
import { DndContext, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Column } from "../components/jobList.jsx";
import Navigation from "../components/Navigation.jsx";
import { arrayMove } from "@dnd-kit/sortable";
import Modal from "../components/modal.jsx";

export const Dashboard = () => {
    const [jsonData, setJsonData] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Configure sensors for both pointer and touch inputs
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1 // Minimum drag distance for mouse
            }
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100, // 250ms delay for touch
                tolerance: 5 // 5px movement tolerance during delay
            }
        })
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('https://vps.sumitsaw.tech/api/mcp101');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

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

    return (
        <>
            <Navigation activity={[true, false, false, false]} />
            <div>Task</div>

            <DndContext
                onDragEnd={handleDragEnd}
                collisionDetection={closestCorners}
                sensors={sensors} // Add sensors prop
            >
                <Column tasks={jsonData} openModal={openModal} />

                {isModalOpen && (
                    <Modal task={selectedTask} onClose={closeModal} />
                )}
            </DndContext>
        </>
    );
};
