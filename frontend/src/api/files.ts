import apiClient from "@/api/config";

export const getAllFiles = async () => {
    const response = await apiClient.get("/files");
    return response.data;
}