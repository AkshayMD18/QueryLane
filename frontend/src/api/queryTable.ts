import apiClient from "./config";

export const generateQuery = async (query: string) => {
    const response = await apiClient.post("/agents/query", { query });
    return response.data;
};

export const executeAndStoreQuery = async (query: string, tableName: string) => {
    const response = await apiClient.post("/query", { query, tableName });
    return response.data;
};

// export const getAllQueriesForTable = async (tableName: string) => {
//     const response = await apiClient.get(`/query`, {tableName});
//     return response.data;
// };