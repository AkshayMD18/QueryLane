import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { executeAndStoreQuery, getAllQueriesForTable, deleteQuery, executeAndStoreGroupQuery, getAllQueriesForGroup, deleteGroupQuery } from "@/api";
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

export const useGetAllQueriesForGroup = (groupId: number) => {
    return useQuery({
        queryKey: ['group-queries', groupId],
        queryFn: () => getAllQueriesForGroup(groupId),
        enabled: !isNaN(groupId),
    });
}

export const useExecuteAndStoreGroupQuery = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ query, groupId, userQuery }: { query: queryResponse, groupId: number, userQuery: string }) => executeAndStoreGroupQuery(query, groupId, userQuery),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group-queries"] });
        }
    });
}

export const useDeleteGroupQuery = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteGroupQuery(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["group-queries"] });
        }
    });
}

