import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { table } from "@/type";


export const TablesTable = ({ tables, onRowClick }: { tables: table[], onRowClick: (id: number, tableName: string) => void }) => {
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
                    {tables.map((tbl) => (
                        <TableRow
                            key={tbl.name}
                            className="cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => onRowClick(tbl.id, tbl.tableName)}
                        >
                            <TableCell className="font-medium">{tbl.name}</TableCell>
                            <TableCell className="font-mono text-xs">{tbl.tableName}</TableCell>
                            <TableCell className="text-muted-foreground">{tbl.summary}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
