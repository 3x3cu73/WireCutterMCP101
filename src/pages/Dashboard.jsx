import React, {useEffect, useState} from "react";
import {closestCorners, DndContext} from "@dnd-kit/core";
import {Column} from "../components/jobList.jsx";
import Navigation from "../components/Navigation.jsx";
import {arrayMove} from "@dnd-kit/sortable";


export const Dashboard = () => {
    // const [data, setData] = useState([]);
    const [jsonData,setJsonData] = useState([]);
    useEffect(() => {
        fetchData();
    }, []);
    const fetchData = async () => {
        try{
            const response=await fetch('https://vps.sumitsaw.tech/api/mcp101');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json(); // Parse JSON data
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
        }
        catch(error){
            console.log(error);
        }
    }





    const handleDragEnd = event => {
        const {active,over}=event
        if (active.id===over.id) return null;

        setJsonData(jsonData=>{
            const oldPosition=jsonData.findIndex(task => task.id === active.id)
            const newPosition=jsonData.findIndex(task => task.id === over.id)

            return arrayMove(jsonData,oldPosition,newPosition)

        })
        console.log(jsonData)

    }

    // console.log(jsonData);

    return (
        <>
            <Navigation activity={[true,false,false,false]}/>
            {/*<Example items={data} />*/}
        <div>Task</div>
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
            <Column tasks={jsonData}/>
        </DndContext>
        </>
    )
}