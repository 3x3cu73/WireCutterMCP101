import React from "react";
import {CSS} from "@dnd-kit/utilities";
import {useSortable} from "@dnd-kit/sortable";

export const Task=({id, title})=>{
    const {attributes , listeners,setNodeRef,transform ,transition } = useSortable({id});

    const style ={
        transition,
        transform:CSS.Transform.toString(transform),
    }
    return <div ref={setNodeRef} {...attributes} {...listeners} className="task" style={style}>{title} {id}</div>
}