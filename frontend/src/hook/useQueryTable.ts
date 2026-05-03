import { useMutation } from "@tanstack/react-query";
import { generateQuery, executeAndStoreQuery } from "@/api";
import type { queryResponse } from "src/type";

export const useGenerateQuery = () => {
    return useMutation({
        mutationFn: (query: string) => generateQuery(query),
    });
}

export const useExecuteAndStoreQuery = () => {
    return useMutation({
        mutationFn: ({ query, tableName }: { query: queryResponse, tableName: string }) => executeAndStoreQuery(query, tableName),
    });
}