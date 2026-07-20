import apiClient from "@/api/config";

export const getAllFiles = async (page?: number, limit?: number, groupId?: number) => {
    const response = await apiClient.get("/files", {
        params: { page, limit, groupId }
    });
    return response.data;
}

export const getColumns = async (name: string) => {
    const response = await apiClient.get(`/files/columns/${name}`);
    return response.data;
}

export const getTableData = async (name: string, page?: number, limit?: number) => {
    const response = await apiClient.get(`/files/${name}`, {
        params: { page, limit }
    });
    return response.data;
}

export const uploadFile = async (file: File, name: string, groupId: number) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/files`, formData, {
        params: { name, groupId }, // goes as query param
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};