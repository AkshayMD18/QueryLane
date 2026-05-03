import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";



export const UploadModal = ({ onUpload, isUploading }: { onUpload: (file: File, name: string) => Promise<void>; isUploading: boolean }) => {
    const [open, setOpen] = React.useState(false);
    const [file, setFile] = React.useState<File | null>(null);
    const [name, setName] = React.useState("");

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !name) return;

        try {
            await onUpload(file, name);
            setOpen(false);
            setFile(null);
            setName("");
        } catch (error) {
            // Error handling is managed by the caller/hook
        }
    };

    return (
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
    );
};
