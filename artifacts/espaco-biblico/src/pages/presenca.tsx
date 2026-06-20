import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  useListChildren, 
  useMarkAttendance,
  Child
} from "@workspace/api-client-react";
import { Search, CheckCircle2, UserPlus } from "lucide-react";
import { Link } from "wouter";

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

  const { data: children, isLoading, refetch } = useListChildren({
    query: {
      queryKey: ['/api/children', { search: debouncedSearch }]
    }
  });

  const markAttendance = useMarkAttendance();

  const handleMarkAttendance = (child: Child) => {
    if (child.presentToday) return;

    markAttendance.mutate(
      { data: { childId: child.id, attendanceDate: format(new Date(), "yyyy-MM-dd") } },
      {
        onSuccess: () => {
          toast({
            title: "Presença registrada",
            description: `${child.fullName} marcado(a) como presente.`,
          });
          refetch(); // Fast refetch to update the list
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível registrar a presença.",
          });
        }
      }
    );
  };

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
                <Button 
                  size="lg"
                  variant={child.presentToday ? "outline" : "default"}
                  className={`w-32 h-14 ${child.presentToday ? "bg-green-50 text-green-700 border-green-200" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMarkAttendance(child);
                  }}
                  disabled={child.presentToday || markAttendance.isPending}
                >
                  {child.presentToday ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Presente
                    </>
                  ) : "Marcar"}
                </Button>
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
