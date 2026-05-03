import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllFiles, getColumns, getTableData, uploadFile } from "@/api";

export const useFiles = (page?: number, limit?: number) => {
    return useQuery({
        queryKey: ["files", page, limit],
        queryFn: () => getAllFiles(page, limit),
    });
}

export const useColumns = (name: string) => {
    return useQuery({
        queryKey: ["columns", name],
        queryFn: () => getColumns(name),
    });
}

export const useTableData = (name: string, page?: number, limit?: number) => {
    return useQuery({
        queryKey: ["tableData", name, page, limit],
        queryFn: () => getTableData(name, page, limit),
    });
}

export const useUploadFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, name }: { file: File; name: string }) =>
            uploadFile(file, name),

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["files"] });
            console.log('File uploaded successfully', data);
        },

        onError: (error: any) => {
            console.error('File upload failed', error);
        },
    });
};