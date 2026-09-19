import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListChildrenQueryKey,
  getListDeletedChildrenQueryKey,
  useListDeletedChildren,
  useRestoreChild,
} from "@workspace/api-client-react";
import { Clock3, RotateCcw, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function LixeiraPage() {
  const { data: deletedChildren, isLoading } = useListDeletedChildren();
  const restoreMutation = useRestoreChild();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const restore = (id: number, name: string) => {
    restoreMutation.mutate(
      { id },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getListDeletedChildrenQueryKey() }),
            queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() }),
          ]);
          toast({ title: "Cadastro restaurado", description: `${name} voltou para a lista de crianças.` });
        },
        onError: () => toast({ variant: "destructive", title: "Não foi possível restaurar o cadastro." }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lixeira administrativa</h1>
        <p className="text-muted-foreground">
          Cadastros excluídos ficam disponíveis por 30 dias para restauração.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
        </div>
      ) : deletedChildren && deletedChildren.length > 0 ? (
        <div className="space-y-3">
          {deletedChildren.map((child) => (
            <Card key={child.id} className="border-amber-200 bg-amber-50/40">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-amber-700" />
                    <h2 className="font-semibold">{child.fullName}</h2>
                    <span className="text-xs text-muted-foreground">Nº {child.childNumber}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Excluída em {format(new Date(child.deletedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-amber-800">
                    <Clock3 className="h-3.5 w-3.5" />
                    Expira {formatDistanceToNow(new Date(child.deletionExpiresAt), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <Button
                  onClick={() => restore(child.id, child.fullName)}
                  disabled={restoreMutation.isPending}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          Nenhum cadastro excluído nos últimos 30 dias.
        </div>
      )}
    </div>
  );
}