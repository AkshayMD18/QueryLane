import { generateQuery, generateTasks, generateJoinQuery, generateSchemaForGroup } from "@/api";
import { useMutation } from "@tanstack/react-query";

export const useGenerateQuery = () => {
    return useMutation({
        mutationFn: ({ query, tableName }: { query: string, tableName: string }) => generateQuery(query, tableName),
    });
}

export const useGenerateTasks = () => {
    return useMutation({
        mutationFn: (tableName: string) => generateTasks(tableName),
    });
}

export const useGenerateJoinQuery = () => {
    return useMutation({
        mutationFn: ({ groupId, query }: { groupId: number, query: string }) => generateJoinQuery(groupId, query),
    });
}

export const useGenerateSchemaForGroup = () => {
    return useMutation({
        mutationFn: (groupId: number) => generateSchemaForGroup(groupId),
    });
};
