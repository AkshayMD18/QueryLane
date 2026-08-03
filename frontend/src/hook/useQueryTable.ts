import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { executeAndStoreQuery, getAllQueriesForTable, deleteQuery } from "@/api";
import type { queryResponse } from "src/type";

export const useGetAllQueriesForTable = (tableId: number) => {
    return useQuery({
        queryKey: ['queries', tableId],
        queryFn: () => getAllQueriesForTable(tableId),
        enabled: !isNaN(tableId),
    });
}

export const useExecuteAndStoreQuery = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ query, tableId, userQuery }: { query: queryResponse, tableId: number, userQuery: string }) => executeAndStoreQuery(query, tableId, userQuery),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["queries"] });
        }
    },);
}

export const useDeleteQuery = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteQuery(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["queries"] });
        }
    });
}
