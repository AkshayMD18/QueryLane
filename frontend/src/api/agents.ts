import apiClient from "./config";

export const generateQuery = async (query: string) => {
    const response = await apiClient.post("/agents/query", { query });
    return response.data;
};

export const generateTasks = async (tableName: string) => {
    const response = await apiClient.get(`/agents/generate-tasks`, { params: { tableName } });
    return response.data;
}
