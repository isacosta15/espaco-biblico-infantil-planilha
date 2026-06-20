import React, { useState } from "react";
import { 
  useListCongregations, 
  useCreateCongregation, 
  useUpdateCongregation,
  useDeleteCongregation,
  Congregation
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Trash2, MapPin, Phone, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { getListCongregationsQueryKey } from "@workspace/api-client-react";

const schema = z.object({
  name: z.string().min(3, "Nome é obrigatório"),
  responsibleName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").or(z.literal("")).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export default function CongregacoesPage() {
  const { data: congregations, isLoading } = useListCongregations();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCongregation, setEditingCongregation] = useState<Congregation | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useCreateCongregation();
  const updateMutation = useUpdateCongregation();
  const deleteMutation = useDeleteCongregation();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      responsibleName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
    },
  });

  const handleOpenForm = (congregation?: Congregation) => {
    if (congregation) {
      setEditingCongregation(congregation);
      form.reset({
        name: congregation.name,
        responsibleName: congregation.responsibleName || "",
        phone: congregation.phone || "",
        email: congregation.email || "",
        address: congregation.address || "",
        city: congregation.city || "",
        state: congregation.state || "",
      });
    } else {
      setEditingCongregation(null);
      form.reset({
        name: "",
        responsibleName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
      });
    }
    setIsOpen(true);
  };

  const onSubmit = (values: z.infer<typeof schema>) => {
    // clean empty strings
    const data = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "")
    );

    if (editingCongregation) {
      updateMutation.mutate(
        { id: editingCongregation.id, data },
        {
          onSuccess: () => {
            toast({ title: "Congregação atualizada" });
            setIsOpen(false);
            queryClient.invalidateQueries({ queryKey: getListCongregationsQueryKey() });
          },
          onError: () => toast({ variant: "destructive", title: "Erro ao atualizar" })
        }
      );
    } else {
      createMutation.mutate(
        { data: data as any },
        {
          onSuccess: () => {
            toast({ title: "Congregação criada" });
            setIsOpen(false);
            queryClient.invalidateQueries({ queryKey: getListCongregationsQueryKey() });
          },
          onError: () => toast({ variant: "destructive", title: "Erro ao criar" })
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          toast({ title: "Congregação excluída" });
          setDeleteId(null);
          queryClient.invalidateQueries({ queryKey: getListCongregationsQueryKey() });
        },
        onError: () => toast({ variant: "destructive", title: "Erro ao excluir. Verifique se há crianças vinculadas." })
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Congregações</h1>
          <p className="text-muted-foreground">Gerencie os locais e responsáveis.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="h-11 px-6 rounded-xl shadow-sm">
          <Plus className="w-5 h-5 mr-2" />
          Nova Congregação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : congregations?.map((congregation) => (
          <Card key={congregation.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-primary">{congregation.name}</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleOpenForm(congregation)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(congregation.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                {congregation.responsibleName && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="truncate">{congregation.responsibleName}</span>
                  </div>
                )}
                {congregation.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{congregation.phone}</span>
                  </div>
                )}
                {congregation.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{congregation.address} {congregation.city ? `- ${congregation.city}/${congregation.state}` : ''}</span>
                  </div>
                )}
                {congregation.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{congregation.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCongregation ? "Editar Congregação" : "Nova Congregação"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Congregação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Sede, Congregação Bairro X..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="responsibleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado (UF)</FormLabel>
                      <FormControl>
                        <Input maxLength={2} placeholder="Ex: SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  Salvar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Congregação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
