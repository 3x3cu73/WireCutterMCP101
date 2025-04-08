import React, {useState} from "react";
import axios from "axios";



export const CreateJob=({closeNewModal})=>{
    // const [isModalOpen, setIsModalOpen] = useState(false);
    //
    // const openModal = () => {setIsModalOpen(true)};
    // const closeModal = () => setIsModalOpen(false);
    // openModal();

    const [task, setTask] = useState({"user":"test"});

    const handleChange = (event) => {

        const { name, value } = event.target; // Extract name and value from the input
        // Update the task state by creating a new object and merging it with the existing state
        setTask(prevTask => ({  [name]: value,...prevTask }));

    }

    const handleSubmit = async(event) => {
        event.preventDefault();

        // console.log("handleSubmit",task);
        const url = `https://vps.sumitsaw.tech/api/mcp101`;

        try {
            const response = await axios.post(url, task, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            });
            console.log("Response:", response.data);
            closeNewModal();
            return response.data; // Return the response if needed
        } catch (error) {
            // closeNewModal()
            console.error("Error updating job details:", error);
            throw error; // Rethrow the error if further handling is needed
        }
    }



    return <div className="mt-6 space-y-4">
        <div>
            <label className="text-sm font-medium text-gray-500">Title</label>
            <br/>
            <input name="title" type="text" defaultValue={task.title} onBlur={handleChange}/>
        </div>

        <div>
            <label className="text-sm font-medium text-gray-500">Description</label>
            <br/>
            {/*<p className="mt-1 text-gray-700 leading-relaxed">{task.description}</p>*/}
            <input name="description" type="text" defaultValue={task.description  || ""} onBlur={handleChange}/>
        </div>


        <div>
            <label className="text-sm font-medium text-gray-500">Quantity</label>
            <br/>
            <input name="a" type="text" defaultValue={task.a} onBlur={handleChange}/>
            {/*<input type="text"/>*/}
        </div>
        <div>
            <label className="text-sm font-medium text-gray-500">Length</label>
            <br/>
            <input name="b" type="text" defaultValue={task.b} onBlur={handleChange}/>
        </div>
        <div>
            <label className="text-sm font-medium text-gray-500">Stripping</label>
            <br/>
            <input name="c" type="text" defaultValue={task.c} onBlur={handleChange}/>
        </div>



        <button className="w-28 m-3  border border-white bg-blue-500 hover:border hover:border-blue-600 text-white font-bold py-2 px-4 rounded" onClick={handleSubmit}>Create</button>


    </div>
}