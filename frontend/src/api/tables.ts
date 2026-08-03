import apiClient from "@/api/config";

export const getAllTables = async (page?: number, limit?: number, groupId?: number) => {
    const response = await apiClient.get("/tables", {
        params: { page, limit, groupId }
    });
    return response.data;
}

export const getTableById = async (id: number) => {
    const response = await apiClient.get(`/tables/metadata/${id}`);
    return response.data;
}

export const getColumns = async (name: string) => {
    const response = await apiClient.get(`/tables/columns/${name}`);
    return response.data;
}

export const getTableData = async (name: string, page?: number, limit?: number) => {
    const response = await apiClient.get(`/tables/${name}`, {
        params: { page, limit }
    });
    return response.data;
}

export const uploadTable = async (file: File, name: string, groupId: number) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/tables`, formData, {
        params: { name, groupId }, // goes as query param
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};
