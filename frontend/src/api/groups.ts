import apiClient from "@/api/config";

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
