// const fetchData = async ({setJsonData}) => {
//     try {
//         const response = await fetch('https://vps.sumitsaw.tech/api/mcp101');
//         if (!response.ok)  new Error(`HTTP error! Status: ${response.status}`);
//
//         const result = await response.json();
//         setJsonData(result["jobs"].map((item) => ({
//             jobid: item[0],
//             id: item[1],
//             status: item[2],
//             user: item[3],
//             a: item[4],
//             b: item[5],
//             c: item[6],
//             timestamp: item[7],
//             description: item[8],
//             title: item[9]
//         })));
//     } catch (error) {
//         console.log(error);
//     }
// };
import axios from "axios";

// Base URL for the API
const BASE_URL = "https://vps.sumitsaw.tech/api/mcp101";

// Service function to fetch data
export const fetchMCP101Data = async () => {
    try {
        const response = await axios.get(BASE_URL, {
            headers: {
                Accept: "application/json", // Specify that we accept JSON responses
            },
        });
        let result=response.data["jobs"]

        result=result.map((item) => ({
            jobid: item[0],
            id: item[1],
            status: item[2],
            user: item[3],
            a: item[4],
            b: item[5],
            c: item[6],
            timestamp: item[7],
            description: item[8],
            title: item[9]
        }))
        // setJsonData(result);
        console.log(result);

        return result ; // Return the data from the response
    } catch (error) {
        console.error("Error fetching MCP101 data:", error);
        throw error; // Re-throw the error for further handling
    }
};

