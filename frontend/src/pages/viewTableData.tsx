import React from "react"
import { useParams, useSearchParams } from "react-router-dom"
import {
  useTableData,
  useColumns,
  useGenerateQuery,
  useExecuteAndStoreQuery,
  useGetAllQueriesForTable,
  useDeleteQuery,
  useGenerateTasks,
} from "@/hook"
import { DataTable, QueryModal, QueryResults } from "@/components"
import { PageHeader } from "@/components/ui/pageHeader"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaginationCustom } from "@/components/viewTableData/paginationCustom"

export const ViewTable = () => {
  const { tableName } = useParams()
  const [searchParams] = useSearchParams()
  const tableId = Number(searchParams.get("id"))
  const [page, setPage] = React.useState(0)
  const limit = 20

  const { data: response } = useTableData(tableName!, page, limit)
  const { data: columns } = useColumns(tableName!)
  const { data: queries } = useGetAllQueriesForTable(tableId)
  const { mutateAsync: generateQuery, isPending: isGeneratingQuery } =
    useGenerateQuery()
  const { mutateAsync: executeAndStoreQuery, isPending: isExecutingQuery } =
    useExecuteAndStoreQuery()
  const { mutateAsync: deleteQuery } = useDeleteQuery()
  const { mutateAsync: generateTasks, isPending: isGeneratingTasks } =
    useGenerateTasks()

  const tableData = response?.data
  const total = response?.total || 0
  const totalPages = Math.ceil(total / limit)

  const handleQueryExecute = async (userQuery: string) => {
    try {
      const generationResponse = await generateQuery({
        query: userQuery,
        tableName: tableName!,
      })
      const sqlQuery = generationResponse.SQLiteQuery
      const queryType = generationResponse.queryType

      if (!sqlQuery) throw new Error("Failed to generate SQL query")

      const result = await executeAndStoreQuery({
        query: {
          SQLiteQuery: sqlQuery,
          queryType: queryType,
        },
        tableId: tableId,
        userQuery: userQuery,
      })

      console.log("Query Results:", result)
    } catch (error) {
      console.error("Query Execution failed:", error)
    }
  }

  const handleGenerateTasks = async () => {
    try {
      const { data: tasks } = await generateTasks(tableName!)
      console.log(tasks)
    } catch (error) {
      console.error("Tasks Generation failed:", error)
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        heading={tableName || ""}
        description="View table data"
        actions={
          <QueryModal
            trigger={<Button>Query</Button>}
            onExecute={handleQueryExecute}
            onGenerateTasks={handleGenerateTasks}
            isQueryLoading={isGeneratingQuery || isExecutingQuery}
            isGeneratingTasks={isGeneratingTasks}
          />
        }
      />

      {columns && tableData ? (
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="mb-5 max-w-full overflow-x-auto">
            <TabsTrigger value="table">Table Data</TabsTrigger>
            <TabsTrigger value="results">Query Results</TabsTrigger>
          </TabsList>
          <TabsContent value="table" className="space-y-4">
            <DataTable
              columns={columns}
              tableData={tableData}
              tableName={tableName}
            />

            <PaginationCustom
              page={page}
              totalPages={totalPages}
              setPage={setPage}
            />
          </TabsContent>
          <TabsContent value="results" className="space-y-4">
            <QueryResults
              queries={queries}
              onDelete={(id) => deleteQuery(id)}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
    </div>
  )
}
