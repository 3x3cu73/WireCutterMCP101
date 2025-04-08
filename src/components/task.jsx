import {CSS} from "@dnd-kit/utilities";
import {useSortable} from "@dnd-kit/sortable";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as faIcons from '@fortawesome/free-solid-svg-icons';
import {deleteTask} from "../services/deleteTask.jsx";

export const Task=({id,task,openModal})=>{
    const {attributes , listeners,setNodeRef,transform ,transition } = useSortable({id});

    const style ={
        transition,
        transform:CSS.Transform.toString(transform),
    }

    const className=" m-3  bg-white border border-blue-300 rounded-lg p-2"


    return <div ref={setNodeRef} {...attributes} {...listeners} className={className} style={style}>
        <span className="text-blue-400 font-bold text-lg">{id}.   </span>
        <span className="text-blue-400 font-bold text-lg">{task.title}</span>
        <br/>
        <div className="flex justify-between items-center">
            <span className="text-green-500">Quantity: {task.a}</span>
            <span className="text-red-500">Length: {task.b}</span>
            <span className="text-orange-500">Stripping: {task.c}</span>



            <button onClick={() => openModal(task)}>
                <FontAwesomeIcon
                    icon={faIcons.faPencil}
                    className="text-blue-500 text-xl cursor-pointer hover:text-blue-600"
                    // Pass task to openModal
                    />
        </button>
            <button onClick={() => deleteTask(task)}>
                <FontAwesomeIcon
                    icon={faIcons.faTrashCan}
                    className="text-red-500 text-xl cursor-pointer hover:text-red-600"
                    // Pass task to openModal
                />
            </button>
        </div>


    </div>
}