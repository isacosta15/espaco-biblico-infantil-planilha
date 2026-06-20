import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  useListChildren, 
  useMarkAttendance,
  useUnmarkAttendance,
  getListChildrenQueryKey,
  Child
} from "@workspace/api-client-react";
import { Search, CheckCircle2, UserPlus, X } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChildCard } from "@/components/child-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

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
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: children, isLoading, refetch } = useListChildren(
    debouncedSearch ? { search: debouncedSearch } : {}
  );

  const markAttendance = useMarkAttendance();
  const unmarkAttendance = useUnmarkAttendance();

  const handleMarkAttendance = (child: Child) => {
    if (child.presentToday) return;
    markAttendance.mutate(
      { data: { childId: child.id, attendanceDate: format(new Date(), "yyyy-MM-dd") } },
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Lista de Presença</h1>
        <p className="text-muted-foreground">{format(new Date(), "dd/MM/yyyy")}</p>
      </div>

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

      <div className="space-y-4">
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
      </div>
    </div>
  );
}
