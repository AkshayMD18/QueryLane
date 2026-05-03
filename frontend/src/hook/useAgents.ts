import { generateQuery, generateTasks } from "@/api";
import { useMutation } from "@tanstack/react-query";

export const useGenerateQuery = () => {
    return useMutation({
        mutationFn: (query: string) => generateQuery(query),
    });
}

export const useGenerateTasks = () => {
    return useMutation({
        mutationFn: (tableName: string) => generateTasks(tableName),
    });
}