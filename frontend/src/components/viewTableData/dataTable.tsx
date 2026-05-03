import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import type { DataTableProps } from "@/type";

export const DataTable = ({ columns, tableData, tableName }: DataTableProps) => {
    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        {columns.map((col: any) => (
                            <TableHead key={col.name}>{col.name}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tableData.map((row: any, idx: number) => (
                        <TableRow
                            key={idx}
                            className="cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => console.log(`Clicked row in ${tableName}`, row)}
                        >
                            {columns.map((col: any) => (
                                <TableCell key={col.name}>{row[col.name]?.toString() || '-'}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
