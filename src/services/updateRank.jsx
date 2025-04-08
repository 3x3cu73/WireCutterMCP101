import axios from "axios";

// Define UpdateJob as a standalone function
export const updateJobRank = async (jobrank) => {
    if (!jobrank) {
        console.error("No task provided");
        return;
    }

    const url = `https://vps.sumitsaw.tech/api/mcp101/rank`;

    try {
        const response = await axios.post(url, jobrank, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        console.log("Response:", response.data);
        return response.data; // Return the response if needed
    } catch (error) {
        console.error("Error updating job details:", error);
        throw error; // Rethrow the error if further handling is needed
    }
};
