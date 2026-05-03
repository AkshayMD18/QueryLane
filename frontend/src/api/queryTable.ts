import apiClient from "./config";
import type { queryResponse } from "src/type";

export const executeAndStoreQuery = async (query: queryResponse, tableName: string, userQuery: string) => {
    const response = await apiClient.post("/query", { query, tableName, userQuery });
    return response.data;
};

export const getAllQueriesForTable = async (tableName: string) => {
    const response = await apiClient.get(`/query`, { params: { tableName } });
    return response.data;
};

export const deleteQuery = async (id: number) => {
    const response = await apiClient.delete(`/query`, { params: { id } });
    return response.data;
};
