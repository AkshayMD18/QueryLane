import React from "react";
import { useParams } from "react-router-dom";
import { useTableData, useColumns } from "@/hook";
import { DataTable, QueryModal, QueryResults } from "@/components";
import { PageHeader } from "@/components/ui/pageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ViewTable: React.FC = () => {
    const { tableName } = useParams();
    const { data: tableData } = useTableData(tableName!);
    const { data: columns } = useColumns(tableName!);

    return (
        <div className="p-8">
            <PageHeader
                heading={tableName || ""}
                description="View table data"
                actions={
                    <QueryModal
                        trigger={<Button>Query</Button>}
                        onExecute={(query) => console.log("Executing:", query)}
                    />
                }
            />

            {columns && tableData ? (
                <Tabs defaultValue="table" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="table">Table Data</TabsTrigger>
                        <TabsTrigger value="results">Query Results</TabsTrigger>
                    </TabsList>
                    <TabsContent value="table">
                        <DataTable
                            columns={columns}
                            tableData={tableData}
                            tableName={tableName}
                        />
                    </TabsContent>
                    <TabsContent value="results">
                        <QueryResults />
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="space-y-4">
                    <div className="flex gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            )}
        </div>
    );
};
