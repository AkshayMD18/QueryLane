import { useQuery } from "@tanstack/react-query";
import { getAllFiles } from "@/api";

export const useFiles = () => {
    return useQuery({
        queryKey: ["files"],
        queryFn: getAllFiles,
    });
}