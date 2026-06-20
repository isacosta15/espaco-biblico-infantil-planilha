import React from "react";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetChild, 
  useGetChildFrequency, 
  useGetChildAttendance,
  useDeleteChild
} from "@workspace/api-client-react";
import { calculateAge, getGenderColor, formatWhatsAppLink, formatDate, formatDateTime } from "@/lib/utils";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ChildProfilePage() {
  const [, params] = useRoute("/criancas/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();

  const { data: child, isLoading: isChildLoading } = useGetChild(id, { query: { enabled: !!id } });
  const { data: frequency, isLoading: isFreqLoading } = useGetChildFrequency(id, { query: { enabled: !!id } });
  const { data: attendanceHistory, isLoading: isAttLoading } = useGetChildAttendance(id, { query: { enabled: !!id } });
  
  const deleteMutation = useDeleteChild();

  const handleDelete = () => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Criança excluída com sucesso" });
          setLocation("/criancas");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Erro ao excluir" });
        }
      }
    );
  };

  if (isChildLoading) {
    return <div className="space-y-6"><Skeleton className="h-40 w-full" /><Skeleton className="h-80 w-full" /></div>;
  }

  if (!child) {
    return <div>Criança não encontrada.</div>;
  }

  const age = child.age ?? calculateAge(child.birthDate);
  const isOlder = age >= 12;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/criancas")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Link href={`/criancas/${id}/editar`}>
            <a className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </a>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir criança?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o cadastro de {child.fullName}? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sim, excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className={`border-0 shadow-sm ${isOlder ? "border-yellow-400 border-2" : ""}`}>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold shrink-0 ${child.gender === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                  {child.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{child.fullName}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className={getGenderColor(child.gender)}>
                        {child.gender === 'F' ? 'Menina' : 'Menino'}
                      </Badge>
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                        {age} anos
                      </Badge>
                      {isOlder && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          12+ Atenção
                        </Badge>
                      )}
                      {child.autism && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                          TEA
                        </Badge>
                      )}
                      {child.foodRestriction && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          🥜 Restrição
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Responsável</p>
                      <p className="text-base text-foreground font-medium">{child.guardianName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone / WhatsApp</p>
                      <a 
                        href={formatWhatsAppLink(child.guardianPhone)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-base text-primary font-medium hover:underline inline-flex items-center gap-1"
                      >
                        {child.guardianPhone}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                      <p className="text-base text-foreground font-medium">{formatDate(child.birthDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Congregação</p>
                      <p className="text-base text-foreground font-medium">{child.congregationName || "Não informada"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {(child.foodRestrictionDescription || child.observations) && (
                <div className="mt-8 pt-8 border-t space-y-4">
                  {child.foodRestrictionDescription && (
                    <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                      <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        Detalhes da Restrição Alimentar
                      </div>
                      <p className="text-red-700 text-sm">{child.foodRestrictionDescription}</p>
                    </div>
                  )}
                  {child.observations && (
                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                        <Info className="w-4 h-4" />
                        Observações
                      </div>
                      <p className="text-amber-700 text-sm">{child.observations}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Frequência</CardTitle>
            </CardHeader>
            <CardContent>
              {isFreqLoading ? (
                <Skeleton className="h-32" />
              ) : frequency ? (
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-primary">{Math.round(frequency.frequencyPercent)}%</span>
                    <span className="text-sm text-muted-foreground pb-1">presença global</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500"/> Presente</span>
                      <span className="font-medium">{frequency.presenceCount} vezes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1"><XCircle className="w-4 h-4 text-red-500"/> Ausente</span>
                      <span className="font-medium">{frequency.absenceCount} vezes</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sem dados de frequência.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Últimas Presenças</CardTitle>
            </CardHeader>
            <CardContent>
              {isAttLoading ? (
                <Skeleton className="h-40" />
              ) : attendanceHistory && attendanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {attendanceHistory.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 py-2 border-b last:border-0 last:pb-0">
                      <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatDate(att.attendanceDate)}</p>
                        <p className="text-xs text-muted-foreground">{att.attendanceTime.substring(0,5)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                  Nenhum registro de presença.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
