import { useMutation } from "@tanstack/react-query";
import { generateQuery, executeAndStoreQuery } from "@/api";

export const useGenerateQuery = () => {
    return useMutation({
        mutationFn: (query: string) => generateQuery(query),
    });
}

export const useExecuteAndStoreQuery = () => {
    return useMutation({
        mutationFn: ({ query, tableName }: { query: string, tableName: string }) => executeAndStoreQuery(query, tableName),
    });
}