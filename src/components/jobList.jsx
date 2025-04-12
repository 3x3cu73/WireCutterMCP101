import {SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";
import {Task} from "./task.jsx";

export const Column=({tasks,openModal})=>{
    // Removed fixed width `w-128` and `min-w-32` to allow the column to be responsive.
    // It will now take the width allocated by its parent container (likely a grid cell in Dashboard.jsx).
    // Kept `flex flex-col` to ensure tasks stack vertically within the column.
    // Kept padding `p-4` for internal spacing within the column.
    // Kept margin `m-3` for spacing between columns (adjust if needed based on parent gap).
    const className="overflow-y-auto m-1 min-h-32 flex flex-col bg-blue-200 border border-blue-600 rounded-lg p-4"

    return (
        <>
            {/* Apply the responsive className */}
            <div className={className}>
                <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                    {/* Ensure tasks exist and is an array before mapping */}
                    {Array.isArray(tasks) && tasks.map((task)=>(
                        <Task key={task.id} id={task.id} task={task} openModal={openModal}/>
                    ))}
                </SortableContext>
            </div>
        </>
    )
};