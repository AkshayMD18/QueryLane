import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroupById, useTables, useUploadTable, useGenerateJoinQuery } from "@/hook";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/pageHeader";
import { PaginationCustom } from "@/components/viewTableData/paginationCustom";
import { UploadModal, TablesTable, QueryModal } from "@/components";
import { Button } from "@/components/ui/button";

export const GroupPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = React.useState(0);
    const limit = 20;

    const { data: group, isLoading: isGroupLoading } = useGroupById(Number(groupId));
    const { data: response, isLoading: isTablesLoading } = useTables(page + 1, limit, Number(groupId));
    const { mutateAsync: uploadTable, isPending: isUploading } = useUploadTable();
    const { mutateAsync: generateJoinQuery } = useGenerateJoinQuery();

    const handleUpload = async (file: File, name: string) => {
        await uploadTable({ file, name, groupId: Number(groupId) });
    };

    const handleQueryExecute = async (userQuery: string) => {
        await generateJoinQuery({ query: userQuery, groupId: Number(groupId) });
    };

    const handleGenerateTasks = async () => {
        console.log("Generate group tasks");
    };

    const tables = response?.data;
    const total = response?.total || 0;
    const totalPages = Math.ceil(total / limit);

    if (isGroupLoading) {
        return (
            <div className="w-full space-y-4">
                <Skeleton className="h-10 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                heading={group?.name || "Group Details"}
                description={`Organized tables under group ID: ${groupId}`}
                actions={
                    <div className="flex items-center gap-3">
                        <QueryModal
                            trigger={<Button variant="outline">Query Group</Button>}
                            onExecute={handleQueryExecute}
                            onGenerateTasks={handleGenerateTasks}
                            isQueryLoading={false}
                            isGeneratingTasks={false}
                        />
                        <UploadModal onUpload={handleUpload} isUploading={isUploading} />
                    </div>
                }
            />

            {isTablesLoading ? (
                <div className="w-full space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            ) : tables && tables.length > 0 ? (
                <div className="space-y-4">
                    <TablesTable
                        tables={tables || []}
                        onRowClick={(id, tableName) => navigate(`/file/${tableName}?id=${id}`)}
                    />
                    <PaginationCustom
                        page={page}
                        totalPages={totalPages}
                        setPage={setPage}
                    />
                </div>
            ) : (
                <p className="text-muted-foreground">No tables available in this group. Upload a CSV to get started.</p>
            )}
        </div>
    );
};

export default GroupPage;
