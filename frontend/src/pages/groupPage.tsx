import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroupById, useFiles, useUploadFile } from "@/hook";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/pageHeader";
import { PaginationCustom } from "@/components/viewTableData/paginationCustom";
import { UploadModal, FilesTable, QueryModal } from "@/components";
import { Button } from "@/components/ui/button";

export const GroupPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = React.useState(0);
    const limit = 20;

    const { data: group, isLoading: isGroupLoading } = useGroupById(Number(groupId));
    const { data: response, isLoading: isFilesLoading } = useFiles(page + 1, limit, Number(groupId));
    const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();

    const handleUpload = async (file: File, name: string) => {
        await uploadFile({ file, name, groupId: Number(groupId) });
    };

    const handleQueryExecute = async (userQuery: string) => {
        console.log("Execute group query:", userQuery);
        // Note: Backend logic for multi-table group queries to be added later
    };

    const handleGenerateTasks = async () => {
        console.log("Generate group tasks");
    };

    const files = response?.data;
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

            {isFilesLoading ? (
                <div className="w-full space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            ) : files && files.length > 0 ? (
                <div className="space-y-4">
                    <FilesTable
                        files={files || []}
                        onRowClick={(tableName) => navigate(`/file/${tableName}`)}
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
