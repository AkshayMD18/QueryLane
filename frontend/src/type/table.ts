export interface DataTableProps {
    columns: TableColumn[];
    tableData: import('./query').QueryRow[];
    tableName: string | undefined;
}

export interface QueryModalProps {
    trigger?: React.ReactElement
    onExecute?: (query: string) => void
    onGenerateTasks?: () => void
    isQueryLoading?: boolean;
    isGeneratingTasks?: boolean;
    tasks?: { recommendation: string[] } | unknown[];

}

export type TableColumn = { name: string };
