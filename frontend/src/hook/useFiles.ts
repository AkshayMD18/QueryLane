import { useQuery } from "@tanstack/react-query";
import { getAllFiles, getColumns, getTableData } from "@/api";

export const useFiles = () => {
    return useQuery({
        queryKey: ["files"],
        queryFn: getAllFiles,
    });
}

export const useColumns = (name: string) => {
    return useQuery({
        queryKey: ["columns", name],
        queryFn: () => getColumns(name),
    });
}

export const useTableData = (name: string) => {
    return useQuery({
        queryKey: ["tableData", name],
        queryFn: () => getTableData(name),
    });
}