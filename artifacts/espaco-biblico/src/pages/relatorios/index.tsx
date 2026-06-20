import React from "react";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useListDailyReports, useGetWeeklyStats } from "@workspace/api-client-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function RelatoriosPage() {
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: reports, isLoading: isReportsLoading } = useListDailyReports({
    query: {
      queryKey: ['/api/reports/daily', { startDate: thirtyDaysAgo, endDate: today }]
    }
  });

  const { data: weeklyStats, isLoading: isWeeklyLoading } = useGetWeeklyStats();

  const chartData = React.useMemo(() => {
    if (!weeklyStats) return [];
    return weeklyStats.map(stat => ({
      name: stat.weekLabel,
      Meninas: stat.totalGirls,
      Meninos: stat.totalBoys,
      Total: stat.totalChildren
    }));
  }, [weeklyStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Análise de dados e frequência consolidada.</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Evolução Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          {isWeeklyLoading ? (
            <Skeleton className="w-full h-[400px]" />
          ) : (
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Meninas" fill="hsl(340 60% 60%)" radius={[4, 4, 0, 0]} maxBarSize={50} stackId="a" />
                  <Bar dataKey="Meninos" fill="hsl(200 70% 50%)" radius={[4, 4, 0, 0]} maxBarSize={50} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Relatório Diário (Últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {isReportsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Meninas</TableHead>
                    <TableHead className="text-right">Meninos</TableHead>
                    <TableHead className="text-right font-bold">Total Presente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.reportDate}>
                      <TableCell className="font-medium capitalize">
                        {format(parseISO(report.reportDate), "EEEE, dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right text-pink-600 font-medium">
                        {report.totalGirls}
                      </TableCell>
                      <TableCell className="text-right text-blue-600 font-medium">
                        {report.totalBoys}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-bold text-sm bg-primary/10 text-primary hover:bg-primary/20">
                          {report.totalChildren}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dado encontrado para o período.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
