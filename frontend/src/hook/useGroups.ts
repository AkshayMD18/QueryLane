import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllGroups, getGroupById, createGroup, createPostgresSnapshot } from "@/api";
import type { PostgresSnapshotRequest } from "@/type/groups";

export const useGroups = () => {
    return useQuery({
        queryKey: ["groups"],
        queryFn: getAllGroups,
    });
};

export const useGroupById = (id: number) => {
    return useQuery({
        queryKey: ["group", id],
        queryFn: () => getGroupById(id),
        enabled: !!id,
    });
};

export const useCreateGroup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => createGroup(name),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            console.log("Group created successfully", data);
        },
        onError: (error: any) => {
            console.error("Group creation failed", error);
        },
    });
};

export const useCreatePostgresSnapshot = () => {
    return useMutation({
        mutationFn: (request: PostgresSnapshotRequest) => createPostgresSnapshot(request),
    });
};
