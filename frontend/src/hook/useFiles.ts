import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllFiles, getColumns, getTableData, uploadFile } from "@/api";

export const useFiles = (page?: number, limit?: number, groupId?: number) => {
    return useQuery({
        queryKey: ["files", page, limit, groupId],
        queryFn: () => getAllFiles(page, limit, groupId),
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
        mutationFn: ({ file, name, groupId }: { file: File; name: string; groupId: number }) =>
            uploadFile(file, name, groupId),

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["files"] });
            console.log('File uploaded successfully', data);
        },

        onError: (error: any) => {
            console.error('File upload failed', error);
        },
    });
};