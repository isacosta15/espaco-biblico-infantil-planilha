import React, { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useCreateChild, 
  useUpdateChild, 
  useGetChild, 
  useListCongregations,
  ChildInputGender
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const childSchema = z.object({
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  gender: z.enum(["M", "F"], { required_error: "Selecione o gênero" }),
  guardianName: z.string().min(3, "Nome do responsável é obrigatório"),
  guardianPhone: z.string().min(10, "Telefone válido é obrigatório"),
  congregationId: z.coerce.number().optional().nullable(),
  autism: z.boolean().default(false),
  foodRestriction: z.boolean().default(false),
  foodRestrictionDescription: z.string().optional(),
  observations: z.string().optional(),
});

export default function ChildFormPage() {
  const [matchEdit, params] = useRoute("/criancas/:id/editar");
  const matchNew = useRoute("/criancas/nova")[0];
  const isEditing = matchEdit && params?.id;
  const id = isEditing ? parseInt(params.id!, 10) : 0;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: congregations } = useListCongregations();
  const { data: child, isLoading } = useGetChild(id, { query: { enabled: !!isEditing } });
  
  const createMutation = useCreateChild();
  const updateMutation = useUpdateChild();

  const form = useForm<z.infer<typeof childSchema>>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      gender: undefined,
      guardianName: "",
      guardianPhone: "",
      congregationId: null,
      autism: false,
      foodRestriction: false,
      foodRestrictionDescription: "",
      observations: "",
    },
  });

  useEffect(() => {
    if (isEditing && child) {
      form.reset({
        fullName: child.fullName,
        birthDate: child.birthDate.split('T')[0],
        gender: child.gender as any,
        guardianName: child.guardianName,
        guardianPhone: child.guardianPhone,
        congregationId: child.congregationId,
        autism: child.autism || false,
        foodRestriction: child.foodRestriction || false,
        foodRestrictionDescription: child.foodRestrictionDescription || "",
        observations: child.observations || "",
      });
    }
  }, [isEditing, child, form]);

  const watchFoodRestriction = form.watch("foodRestriction");

  function onSubmit(values: z.infer<typeof childSchema>) {
    // Clean up empty strings to undefined to match API
    const data = {
      ...values,
      gender: values.gender as ChildInputGender,
      congregationId: values.congregationId || undefined,
      foodRestrictionDescription: values.foodRestriction ? values.foodRestrictionDescription : undefined,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            toast({ title: "Cadastro atualizado com sucesso" });
            setLocation(`/criancas/${id}`);
          },
          onError: () => toast({ variant: "destructive", title: "Erro ao atualizar" })
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: (res) => {
            toast({ title: "Criança cadastrada com sucesso" });
            setLocation(`/criancas/${res.id}`);
          },
          onError: () => toast({ variant: "destructive", title: "Erro ao cadastrar" })
        }
      );
    }
  }

  if (isEditing && isLoading) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isEditing ? "Editar Criança" : "Nova Criança"}
          </h1>
          <p className="text-muted-foreground">Preencha os dados do cadastro.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Dados da Criança</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: João da Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="M">Menino</SelectItem>
                            <SelectItem value="F">Menina</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Responsável</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="guardianName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Responsável</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Maria da Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone / WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Informações Adicionais</h3>
                
                <FormField
                  control={form.control}
                  name="congregationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Congregação</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val ? Number(val) : null)} 
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a congregação (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {congregations?.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl">
                  <FormField
                    control={form.control}
                    name="autism"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Espectro Autista (TEA)</FormLabel>
                          <FormDescription>
                            Marque se a criança possui diagnóstico.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="foodRestriction"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Restrição Alimentar</FormLabel>
                          <FormDescription>
                            Marque se houver alergias ou restrições.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {watchFoodRestriction && (
                  <FormField
                    control={form.control}
                    name="foodRestrictionDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descreva a restrição alimentar</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Alergia a amendoim, intolerância a lactose..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Gerais</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Qualquer informação importante sobre a criança..." 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="min-w-[120px]">
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
