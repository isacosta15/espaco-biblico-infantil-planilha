import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export default function LoginPage({ adminPortal = false }: { adminPortal?: boolean }) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(
      { data: { ...values, access: adminPortal ? "admin" : "general" } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          toast({
            title: "Bem-vindo!",
            description: "Login realizado com sucesso.",
          });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erro ao entrar",
            description: "Verifique suas credenciais e tente novamente.",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-primary">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <BookOpen className="w-12 h-12" />
          </div>
           <h1 className="text-3xl font-bold text-foreground">Espaço Bíblico</h1>
           <p className="text-muted-foreground mt-1">
             {adminPortal ? "Acesso administrativo" : "Check-in Infantil"}
           </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
             <CardTitle className="text-2xl text-center">
               {adminPortal ? "Entrar como administradora" : "Entrar"}
             </CardTitle>
            <CardDescription className="text-center">
               {adminPortal
                 ? "Acesso à lixeira e às funções administrativas"
                 : "Insira seus dados para acessar o sistema"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium mt-6" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Acessar"}
                </Button>
                <div className="pt-2 text-center text-sm text-muted-foreground">
                  {adminPortal ? (
                    <>
                      Acesso geral?{" "}
                      <Link href="/login" className="font-medium text-primary hover:underline">
                        Entrar como usuário
                      </Link>
                    </>
                  ) : (
                    <>
                      Administradora?{" "}
                      <Link href="/admin-login" className="font-medium text-primary hover:underline">
                        Acessar área administrativa
                      </Link>
                    </>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
