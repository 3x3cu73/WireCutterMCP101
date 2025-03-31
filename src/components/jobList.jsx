import React from "react";
import {SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import {Task} from "./task..jsx";

export const Column=({tasks})=>{
    return (
        <div className="column">
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>

                {tasks.map((task)=>(<Task key={task.id} title={task.title} task={task} id={task.id}/>))}

        </SortableContext>
    </div>)
};