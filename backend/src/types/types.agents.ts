export type tableData = {
    tableName: string
    rowCount: number,
    sampleData: any[]
    columns: string[]
    columnTypes: Record<string, string>
    query?: string,

}   