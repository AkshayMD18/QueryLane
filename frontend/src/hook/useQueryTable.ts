import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateQuery, executeAndStoreQuery, getAllQueriesForTable, deleteQuery } from "@/api";
import type { queryResponse } from "src/type";

export const useGenerateQuery = () => {
    return useMutation({
        mutationFn: (query: string) => generateQuery(query),
    });
}

export const useGetAllQueriesForTable = (tableName: string) => {
    return useQuery({
        queryKey: ['queries', tableName],
        queryFn: () => getAllQueriesForTable(tableName),
    });
}

export const useExecuteAndStoreQuery = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ query, tableName, userQuery }: { query: queryResponse, tableName: string, userQuery: string }) => executeAndStoreQuery(query, tableName, userQuery),
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
