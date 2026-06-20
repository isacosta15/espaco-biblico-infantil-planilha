import React, { useMemo } from "react";
import { Link } from "wouter";
import { 
  useGetDashboardStats, 
  useGetWeeklyStats, 
  useGetBirthdaysThisMonth,
  useGetMostAbsentChildren
} from "@workspace/api-client-react";
import { 
  Users, 
  UserCircle, 
  CheckCircle2, 
  XCircle,
  Gift,
  AlertTriangle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChildCard } from "@/components/child-card";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  className = ""
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  description?: string;
  className?: string;
}) {
  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: weeklyStats, isLoading: weeklyLoading } = useGetWeeklyStats();
  const { data: birthdays, isLoading: birthdaysLoading } = useGetBirthdaysThisMonth();
  const { data: mostAbsent, isLoading: absentLoading } = useGetMostAbsentChildren({ query: { limit: 5 } });

  const chartData = useMemo(() => {
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do ministério infantil.</p>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Presentes Hoje" 
            value={stats.presentToday} 
            icon={CheckCircle2}
            className="bg-green-50/50"
            description={`${stats.todayGirls} meninas, ${stats.todayBoys} meninos`}
          />
          <StatCard 
            title="Ausentes Hoje" 
            value={stats.absentToday} 
            icon={XCircle}
            className="bg-red-50/50"
          />
          <StatCard 
            title="Total de Crianças" 
            value={stats.totalChildren} 
            icon={Users}
            description="Cadastradas no sistema"
          />
          <StatCard 
            title="Meninas" 
            value={stats.totalGirls} 
            icon={UserCircle}
          />
          <StatCard 
            title="Meninos" 
            value={stats.totalBoys} 
            icon={UserCircle}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Frequência nas Últimas Semanas</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyLoading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <Bar dataKey="Meninas" fill="hsl(340 60% 60%)" radius={[4, 4, 0, 0]} maxBarSize={40} stackId="a" />
                    <Bar dataKey="Meninos" fill="hsl(200 70% 50%)" radius={[4, 4, 0, 0]} maxBarSize={40} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="w-5 h-5 text-secondary" />
                Aniversariantes do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              {birthdaysLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : birthdays && birthdays.length > 0 ? (
                <div className="space-y-3">
                  {birthdays.map((child) => (
                    <ChildCard key={child.id} child={child} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-xl">
                  Nenhum aniversariante este mês
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-red-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Atenção: Mais Ausentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {absentLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : mostAbsent && mostAbsent.length > 0 ? (
                <div className="space-y-3">
                  {mostAbsent.map((childFreq) => (
                    <Link key={childFreq.id} href={`/criancas/${childFreq.id}`}>
                      <a className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-100 shadow-sm hover:border-red-300 transition-colors">
                        <div className="truncate pr-4">
                          <p className="font-medium text-sm truncate">{childFreq.fullName}</p>
                          <p className="text-xs text-muted-foreground">{childFreq.absenceCount} faltas</p>
                        </div>
                      </a>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-white/50 rounded-xl">
                  Nenhuma criança com faltas excessivas
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
