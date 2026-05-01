export interface DataTableProps {
    columns: any[];
    tableData: any[];
    tableName: string | undefined;
}

export interface QueryModalProps {
    trigger?: React.ReactElement
    onExecute?: (query: string) => void
    isLoading?: boolean;
}
