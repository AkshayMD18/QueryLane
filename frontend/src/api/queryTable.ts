import apiClient from "./config";
import type { queryResponse } from "src/type";

export const executeAndStoreQuery = async (query: queryResponse, tableId: number, userQuery: string) => {
    const response = await apiClient.post("/query", { query, tableId, userQuery });
    return response.data;
};

export const getAllQueriesForTable = async (tableId: number) => {
    const response = await apiClient.get(`/query`, { params: { tableId } });
    return response.data;
};

export const deleteQuery = async (id: number) => {
    const response = await apiClient.delete(`/query`, { params: { id } });
    return response.data;
};
