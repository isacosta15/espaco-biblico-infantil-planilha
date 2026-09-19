import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  useListChildren, 
  useMarkAttendance,
  useUnmarkAttendance,
  useListAttendance,
  getListChildrenQueryKey,
  getListAttendanceQueryKey,
  Child
} from "@workspace/api-client-react";
import { Search, CheckCircle2, UserPlus, X, ShieldAlert, Utensils, ListChecks } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChildCard } from "@/components/child-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { enqueueOfflineAttendance, enqueueOfflineUnmarkAttendance } from "@/lib/offline-sync";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function PresencaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"checkin" | "presentes">("checkin");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: children, isLoading, refetch } = useListChildren(
    debouncedSearch ? { search: debouncedSearch } : {}
  );
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: attendanceToday, isLoading: isLoadingAttendance } = useListAttendance(
    { date: today },
    { query: { enabled: view === "presentes", queryKey: getListAttendanceQueryKey({ date: today }) } },
  );

  const markAttendance = useMarkAttendance();
  const unmarkAttendance = useUnmarkAttendance();

  const handleMarkAttendance = (child: Child) => {
    if (child.presentToday) return;
    if (!navigator.onLine) {
      enqueueOfflineAttendance(child.id, today);
      toast({
        title: "Presença salva neste dispositivo",
        description: "Clique em “Sincronizar agora” quando a internet voltar.",
      });
      return;
    }
    markAttendance.mutate(
      { data: { childId: child.id, attendanceDate: today } },
      {
        onSuccess: () => {
          toast({ title: "Presença registrada", description: `${child.fullName} marcado(a) como presente.` });
          refetch();
          queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível registrar a presença." });
        }
      }
    );
  };

  const handleUnmarkAttendance = (child: Child) => {
    if (!navigator.onLine) {
      enqueueOfflineUnmarkAttendance(child.id);
      toast({
        title: "Alteração salva neste dispositivo",
        description: "Clique em “Sincronizar agora” quando a internet voltar.",
      });
      return;
    }
    unmarkAttendance.mutate(
      { childId: child.id },
      {
        onSuccess: () => {
          toast({ title: "Presença removida", description: `Presença de ${child.fullName} foi desfeita.` });
          refetch();
          queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível desfazer a presença." });
        }
      }
    );
  };

  const isPending = markAttendance.isPending || unmarkAttendance.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Lista de Presença</h1>
        <p className="text-muted-foreground">{format(new Date(), "dd/MM/yyyy")}</p>
      </div>

      <div className="flex justify-center gap-2 rounded-2xl bg-muted/50 p-1">
        <Button
          variant={view === "checkin" ? "default" : "ghost"}
          className="flex-1"
          onClick={() => setView("checkin")}
        >
          <Search className="mr-2 h-4 w-4" />
          Marcar presença
        </Button>
        <Button
          variant={view === "presentes" ? "default" : "ghost"}
          className="flex-1"
          onClick={() => setView("presentes")}
        >
          <ListChecks className="mr-2 h-4 w-4" />
          Presentes hoje
        </Button>
      </div>

      {view === "checkin" ? (
      <>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Digite o nome da criança..."
          className="pl-12 h-16 text-xl rounded-2xl shadow-sm border-2 border-primary/20 focus-visible:ring-primary/30"
          autoFocus
        />
      </div>
      </>
      ) : (
        <div className="space-y-5">
          {isLoadingAttendance ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border bg-green-50 p-5">
                  <p className="text-sm text-green-800">Presentes hoje</p>
                  <p className="mt-1 text-3xl font-bold text-green-900">{attendanceToday?.length ?? 0}</p>
                </div>
                <div className="rounded-2xl border bg-red-50 p-5">
                  <p className="flex items-center gap-2 text-sm text-red-800"><Utensils className="h-4 w-4" /> Restrição alimentar</p>
                  <p className="mt-1 text-3xl font-bold text-red-900">{attendanceToday?.filter((item) => item.child.foodRestriction).length ?? 0}</p>
                </div>
                <div className="rounded-2xl border bg-blue-50 p-5">
                  <p className="flex items-center gap-2 text-sm text-blue-800"><ShieldAlert className="h-4 w-4" /> TEA</p>
                  <p className="mt-1 text-3xl font-bold text-blue-900">{attendanceToday?.filter((item) => item.child.autism).length ?? 0}</p>
                </div>
              </div>
              {attendanceToday && attendanceToday.length > 0 ? (
                <div className="space-y-3">
                  {attendanceToday.map((item) => (
                    <ChildCard
                      key={item.id}
                      child={item.child}
                      action={<span className="text-sm text-muted-foreground">{item.attendanceTime.substring(0, 5)}</span>}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                  Nenhuma criança foi marcada como presente hoje.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === "checkin" && <div className="space-y-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
        ) : children && children.length > 0 ? (
          children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              action={
                child.presentToday ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1 text-green-700 font-medium text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Presente
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnmarkAttendance(child);
                      }}
                      disabled={isPending}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                      Desfazer
                    </button>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    className="w-32 h-14"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMarkAttendance(child);
                    }}
                    disabled={isPending}
                  >
                    Marcar
                  </Button>
                )
              }
            />
          ))
        ) : debouncedSearch ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-muted p-8">
            <h3 className="text-lg font-medium text-foreground mb-2">Criança não encontrada</h3>
            <p className="text-muted-foreground mb-6">Não encontramos ninguém com o nome "{debouncedSearch}".</p>
            <Link href="/criancas/nova">
              <a className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm">
                <UserPlus className="w-5 h-5 mr-2" />
                Adicionar Criança
              </a>
            </Link>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Comece a digitar o nome da criança para marcar a presença.
          </div>
        )}
      </div>}
    </div>
  );
}
