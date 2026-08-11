import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllTables, getTableById, getColumns, getTableData, uploadTable } from "@/api";

export const useTables = (page?: number, limit?: number, groupId?: number) => {
    return useQuery({
        queryKey: ["tables", page, limit, groupId],
        queryFn: () => getAllTables(page, limit, groupId),
    });
}

export const useTableMetadata = (id: number) => {
    return useQuery({
        queryKey: ["tableMetadata", id],
        queryFn: () => getTableById(id),
        enabled: !isNaN(id),
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

export const useUploadTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, name, groupId }: { file: File; name: string; groupId: number }) =>
            uploadTable(file, name, groupId),

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["tables"] });
            console.log('Table uploaded successfully', data);
        },

        onError: (error: Error) => {
            console.error('Table upload failed', error);
        },
    });
};
