import apiClient from "@/api/config";
import type { PostgresSnapshotRequest} from "../type/groups"

export const getAllGroups = async () => {
    const response = await apiClient.get("/groups");
    return response.data;
};

export const getGroupById = async (id: number) => {
    const response = await apiClient.get(`/groups/${id}`);
    return response.data;
};

export const createGroup = async (name: string) => {
    const response = await apiClient.post("/groups", { name });
    return response.data;
};

export const createPostgresSnapshot = async (request: PostgresSnapshotRequest) => {
    const response = await apiClient.post("/groups/postgres-snapshot", request);
    return response.data;
};
