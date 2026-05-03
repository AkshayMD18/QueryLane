import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { QueryRow, QueryResult } from "@/type/query";
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "../ui/badge";

const ValueCard = ({ data }: { data: QueryRow[] }) => {
    if (!data.length) return <div className="text-muted-foreground italic">No data available</div>;

    const firstRow = data[0];
    const value = Object.values(firstRow)[0];

    return (
        <div className="flex items-center justify-center py-6">
            <p className="text-4xl font-bold tracking-tight text-primary">{value}</p>
        </div>
    );
};

const DynamicTable = ({ data }: { data: QueryRow[] }) => {
    if (!data.length) return <div className="text-muted-foreground italic">No data available</div>;

    const columns = Object.keys(data[0]);

    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        {columns.map((col) => (
                            <TableHead key={col}>{col}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, i) => (
                        <TableRow key={i}>
                            {columns.map((col) => (
                                <TableCell key={col}>
                                    {row[col]?.toString() || '-'}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const DynamicChart = ({ data }: { data: QueryRow[] }) => {
    if (!data.length) return <div className="text-muted-foreground italic">No data available</div>;

    const keys = Object.keys(data[0]);
    if (keys.length < 2) return <div className="text-destructive font-medium">Insufficient data columns for visualization</div>;

    const xKey = keys[0];
    const yKey = keys[1];

    // Configure chart to use theme-aware chart colors
    const chartConfig = {
        [yKey]: {
            label: yKey.replace(/_/g, ' '),
            color: "var(--chart-1)",
        },
    };

    return (
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                    dataKey={xKey}
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                    dataKey={yKey}
                    fill={`var(--color-${yKey})`}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                />
            </BarChart>
        </ChartContainer>
    );
};

export const QueryResults = ({ queries }: { queries: QueryResult[] }) => {
    if (!queries || queries.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-10 flex flex-col items-center justify-center text-muted-foreground">
                    <p>No queries found for this table.</p>
                    <p className="text-xs">Use the query agent to generate and execute an analysis task.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            {queries.map((q) => {
                if (!q.data) return null;

                return (
                    <Card key={q.id} className="shadow-sm border-foreground/5 transition-all hover:shadow-md h-full flex flex-col">
                        <CardHeader className="pb-3 border-b bg-muted/10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold truncate max-w-[80%]">
                                    {q.name || "Analysis Result"}
                                </CardTitle>
                                <Badge variant="secondary" className="capitalize font-bold">
                                    {q.queryType}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {q.queryType === 'value' && <ValueCard data={q.data} />}
                            {q.queryType === 'chart' && <DynamicChart data={q.data} />}
                            {q.queryType === 'table' && <DynamicTable data={q.data} />}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
