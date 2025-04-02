import React from "react";

export const EditTask=({task})=>{
    // const [isModalOpen, setIsModalOpen] = useState(false);
    //
    // const openModal = () => {setIsModalOpen(true)};
    // const closeModal = () => setIsModalOpen(false);
    // openModal();
    return                 <div className="mt-6 space-y-4">
        <div>
            <label className="text-sm font-medium text-gray-500">Title</label>
            <p className="mt-1 text-gray-900 font-[500]">{task.title}</p>
        </div>

        <div>
            <label className="text-sm font-medium text-gray-500">Description</label>
            <p className="mt-1 text-gray-700 leading-relaxed">{task.description}</p>
        </div>


        <div>
            <label className="text-sm font-medium text-gray-500">Quantity</label>
            <br/>
            <input type="text" defaultValue={task.a} />
            {/*<input type="text"/>*/}
        </div>
        <div>
            <label className="text-sm font-medium text-gray-500">Length</label>
            <br/>
            <input type="text" defaultValue={task.b}/>
        </div>
        <div>
            <label className="text-sm font-medium text-gray-500">Stripping</label>
            <br/>
            <input type="text" defaultValue={task.c}/>
        </div>
    </div>
}