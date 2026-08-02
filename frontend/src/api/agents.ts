import apiClient from "./config";

export const generateQuery = async (query: string, tableName: string) => {
    const response = await apiClient.post("/agents/query", { query, tableName });
    return response.data;
};

export const generateTasks = async (tableName: string) => {
    const response = await apiClient.get(`/agents/generate-tasks`, { params: { tableName } });
    return response.data;
}

export const generateJoinQuery = async (groupId: number, query: string) => {
    const response = await apiClient.post(`/agents/join-query`, { groupId, query });
    return response.data;
}
