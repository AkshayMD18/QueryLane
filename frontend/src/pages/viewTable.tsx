import React from "react";
import { useParams } from "react-router-dom";
import { useTableData, useColumns } from "@/hook";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export const ViewTable: React.FC = () => {
    const { tableName } = useParams();
    const { data: tableData } = useTableData(tableName!);
    const { data: columns } = useColumns(tableName!);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Table: {tableName}</h1>

            {columns && tableData ? (
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
            ) : (
                <p className="text-muted-foreground">Loading table data...</p>
            )}
        </div>
    );
};