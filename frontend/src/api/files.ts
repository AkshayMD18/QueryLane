import apiClient from "@/api/config";

export const getAllFiles = async () => {
    const response = await apiClient.get("/files");
    return response.data;
}

export const getColumns = async (name: string) => {
    const response = await apiClient.get(`/files/columns/${name}`);
    return response.data;
}

export const getTableData = async (name: string) => {
    const response = await apiClient.get(`/files/${name}`);
    return response.data;
}

export const uploadFile = async (file: File, name: string) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/files`, formData, {
        params: { name }, // goes as query param
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};