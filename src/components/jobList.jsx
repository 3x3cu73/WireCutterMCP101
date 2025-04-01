import {SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import {Task} from "./task..jsx";

export const Column=({tasks,openModal})=>{
    const className="m-3 w-128  min-screen flex-col bg-blue-200 border border-blue-600 rounded-lg p-4"






    return (
        <>
        <div className={className}>
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>

                {tasks.map((task)=>(<Task key={task.id}  id={task.id} task={task} openModal={openModal}/>))}

        </SortableContext>

    </div>
        </>)
};