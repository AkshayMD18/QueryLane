import React from "react";
import { useFiles, useUploadFile } from "@/hook";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { file } from "@/type";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/pageHeader";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";

const HomePage: React.FC = () => {
    const { data: files, isLoading } = useFiles();
    const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [open, setOpen] = React.useState(false);
    const [file, setFile] = React.useState<File | null>(null);
    const [name, setName] = React.useState("");

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !name) return;

        try {
            await uploadFile({ file, name });
            queryClient.invalidateQueries({ queryKey: ["files"] });
            setOpen(false);
            setFile(null);
            setName("");
        } catch (error) {
            // Error is handled in the hook's onError
        }
    };

    return (
        <div>
            <PageHeader heading="Available Data" description="List of uploaded tables" actions={
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger render={<Button>Upload File</Button>} />
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload CSV File</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file to analyze it and generate queries.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter a name for this data"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="file">CSV File</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    required
                                />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isUploading || !file || !name}>
                                    {isUploading ? "Uploading..." : "Upload"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            } />

            {isLoading ? (
                <div className="w-full space-y-4">
                    <Skeleton className="h-10 w-full" />
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            ) : files && files.length > 0 ? (
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