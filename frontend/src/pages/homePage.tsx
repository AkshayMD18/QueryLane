import React from "react";
import { useFiles, useUploadFile } from "@/hook";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/pageHeader";
import { PaginationCustom } from "@/components/viewTableData/paginationCustom";
import { UploadModal, FilesTable } from "@/components";

const HomePage = () => {
    const [page, setPage] = React.useState(0);
    const limit = 20;

    const { data: response, isLoading } = useFiles(page + 1, limit);
    const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
    const navigate = useNavigate();

    const handleUpload = async (file: File, name: string) => {
        await uploadFile({ file, name });
    };

    const files = response?.data;
    const total = response?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <PageHeader
                heading="Available Data"
                description="List of uploaded tables"
                actions={<UploadModal onUpload={handleUpload} isUploading={isUploading} />}
            />

            {isLoading ? (
                <div className="w-full space-y-4">
                    <Skeleton className="h-10 w-full" />
                    {Array.from({ length: 10 }).map((_, i) => (
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
                <p className="text-muted-foreground">No tables available.</p>
            )}
        </div>
    );
};

export default HomePage;