import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useListAttendanceDates, useListAttendance } from "@workspace/api-client-react";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChildCard } from "@/components/child-card";

export default function HistoricoPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: dates, isLoading: isLoadingDates } = useListAttendanceDates();
  const { data: attendanceDetails, isLoading: isLoadingDetails } = useListAttendance(
    { date: selectedDate || undefined },
    { query: { enabled: !!selectedDate } }
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar with dates */}
      <div className="w-full md:w-80 flex flex-col gap-4 border-r pr-0 md:pr-6 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Histórico</h1>
          <p className="text-sm text-muted-foreground">Selecione uma data para ver os presentes.</p>
        </div>

        <div className="space-y-2 mt-4">
          {isLoadingDates ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : dates && dates.length > 0 ? (
            dates.map((report) => {
              const dateStr = report.reportDate;
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`w-full text-left p-4 rounded-xl transition-all border-2 flex items-center justify-between ${
                    isSelected
                      ? "bg-primary/5 border-primary text-primary"
                      : "bg-white border-transparent hover:border-muted-foreground/20 hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarIcon className={`w-5 h-5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium capitalize">
                        {format(parseISO(dateStr), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </span>
                      <span className="text-xs opacity-70">
                        {report.totalChildren} presentes · {report.totalGirls} meninas / {report.totalBoys} meninos
                      </span>
                    </div>
                  </div>
                  {isSelected && <ChevronRight className="w-5 h-5 shrink-0" />}
                </button>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Main content with details */}
      <div className="flex-1 flex flex-col overflow-y-auto pb-8">
        {!selectedDate ? (
          <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 opacity-50" />
            </div>
            <p>Selecione uma data na lista para ver os detalhes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="pb-4 border-b">
              <h2 className="text-2xl font-bold capitalize">
                {format(parseISO(selectedDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h2>
            </div>

            {isLoadingDetails ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
              </div>
            ) : attendanceDetails && attendanceDetails.length > 0 ? (
              <>
                <Card className="bg-primary/5 border-primary/20 border-0 shadow-none">
                  <CardContent className="p-6 flex flex-wrap gap-8">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Presentes</p>
                      <p className="text-3xl font-bold text-primary">{attendanceDetails.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Meninas</p>
                      <p className="text-3xl font-bold text-pink-600">
                        {attendanceDetails.filter(a => a.child.gender === "F").length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Meninos</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {attendanceDetails.filter(a => a.child.gender === "M").length}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-lg font-medium mb-4">Lista de Presentes</h3>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {attendanceDetails.map((att) => (
                      <ChildCard
                        key={att.id}
                        child={att.child as any}
                        action={<span className="text-sm text-muted-foreground">{att.attendanceTime.substring(0, 5)}</span>}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum registro para esta data.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
