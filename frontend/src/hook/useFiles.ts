import { useMutation, useQuery } from "@tanstack/react-query";
import { getAllFiles, getColumns, getTableData, uploadFile } from "@/api";

export const useFiles = () => {
    return useQuery({
        queryKey: ["files"],
        queryFn: getAllFiles,
    });
}

export const useColumns = (name: string) => {
    return useQuery({
        queryKey: ["columns", name],
        queryFn: () => getColumns(name),
    });
}

export const useTableData = (name: string) => {
    return useQuery({
        queryKey: ["tableData", name],
        queryFn: () => getTableData(name),
    });
}

export const useUploadFile = () => {
    return useMutation({
        mutationFn: ({ file, name }: { file: File; name: string }) =>
            uploadFile(file, name),

        onSuccess: (data) => {
            console.log('File uploaded successfully', data);
        },

        onError: (error: any) => {
            console.error('File upload failed', error);
        },
    });
};