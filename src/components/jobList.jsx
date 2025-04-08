import {SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import {Task} from "./task.jsx";

export const Column=({tasks,openModal})=>{
    const className="m-3 w-full md:w-80 min-h-32 bg-blue-100 border border-blue-300 rounded-lg p-4 shadow-md flex-shrink-0"






    return (
        <>
        <div className={className}>
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>

                {tasks.map((task)=>(<Task key={task.id}  id={task.id} task={task} openModal={openModal}/>))}

        </SortableContext>

    </div>
        </>)
};