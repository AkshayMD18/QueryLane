import React from "react";
import { useFiles } from "@/hook";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { file } from "@/type";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
    const { data: files } = useFiles();
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen w-full flex-col items-center bg-background text-foreground p-8">
            <h2 className="text-3xl font-bold mb-6">Available Data</h2>

            {files && files.length > 0 ? (
                <div className="w-full overflow-x-auto">
                    <Table className="w-full">
                        <TableCaption>List of uploaded tables</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Table Name</TableHead>
                                <TableHead>Summary</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {files.map((file: file) => (
                                <TableRow key={file.name} onClick={() => navigate(`/file/${file.tableName}`)}>
                                    <TableCell>{file.name}</TableCell>
                                    <TableCell>{file.tableName}</TableCell>
                                    <TableCell>{file.summary}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <p className="text-muted-foreground">No tables available.</p>
            )}
        </div>
    );
};

export default HomePage;