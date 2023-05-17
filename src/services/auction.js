import axios from "axios";

export const createAuction = async (data) => {
    const result = await axios.post("https://37qnx0shxl.execute-api.us-east-1.amazonaws.com/dev/create-auction", data);
    return result.data;
};
