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
        <div className="w-full overflow-x-auto">
            <Table className="w-full">
                <TableHeader>
                    <TableRow>
                        {columns.map((col: any) => (
                            <TableHead key={col.name}>{col.name}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tableData.map((row: any, idx: number) => (
                        <TableRow
                            key={idx}
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => console.log(`Clicked row in ${tableName}`, row)}
                        >
                            {columns.map((col: any) => (
                                <TableCell key={col.name}>{row[col.name]}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
