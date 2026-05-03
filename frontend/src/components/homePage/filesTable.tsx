import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { file } from "@/type";


export const FilesTable = ({ files, onRowClick }: { files: file[], onRowClick: (tableName: string) => void }) => {
    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>Name</TableHead>
                        <TableHead>Table Name</TableHead>
                        <TableHead>Summary</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file) => (
                        <TableRow
                            key={file.name}
                            className="cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => onRowClick(file.tableName)}
                        >
                            <TableCell className="font-medium">{file.name}</TableCell>
                            <TableCell className="font-mono text-xs">{file.tableName}</TableCell>
                            <TableCell className="text-muted-foreground">{file.summary}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
