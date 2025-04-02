import React from "react";

export const EditTask=({task,handDataUpdate})=>{
    // const [isModalOpen, setIsModalOpen] = useState(false);
    //
    // const openModal = () => {setIsModalOpen(true)};
    // const closeModal = () => setIsModalOpen(false);
    // openModal();

    const handleChange = (event) => {
        const {name, value} = event.target; // Extract name and value from the input

        if (task[name]!==value) {
            // task[name] = value;
            const tmp1 = structuredClone(task); // Create a deep copy of the task object
            tmp1[name] = value; // Update the property
            handDataUpdate(tmp1); // Pass the updated object

        }

    }
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
            <input name ="a" type="text" defaultValue={task.a}   onBlur={handleChange} />
            {/*<input type="text"/>*/}
        </div>
        <div>
            <label className="text-sm font-medium text-gray-500">Length</label>
            <br/>
            <input name ="b"  type="text" defaultValue={task.b}  onBlur={handleChange}/>
        </div>
        <div>
            <label className="text-sm font-medium text-gray-500">Stripping</label>
            <br/>
            <input name ="c"  type="text" defaultValue={task.c} onBlur={handleChange}/>
        </div>
    </div>
}