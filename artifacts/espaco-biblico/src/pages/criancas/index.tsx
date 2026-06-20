import React, { useState } from "react";
import { Link } from "wouter";
import { useListChildren, useListCongregations, ListChildrenGender } from "@workspace/api-client-react";
import { Search, Plus, Filter } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChildCard } from "@/components/child-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function CriancasPage() {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<ListChildrenGender | undefined>(undefined);
  const [congregationId, setCongregationId] = useState<string>("all");
  
  const { data: congregations } = useListCongregations();
  const { data: children, isLoading } = useListChildren({
    query: {
      queryKey: ['/api/children', { search, gender, congregationId: congregationId === "all" ? undefined : Number(congregationId) }]
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Crianças</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de todas as crianças.</p>
        </div>
        <Link href="/criancas/nova">
          <a className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap">
            <Plus className="w-5 h-5 mr-2" />
            Nova Criança
          </a>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-xl shadow-sm border">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-4">
          <Select value={gender || "all"} onValueChange={(v) => setGender(v === "all" ? undefined : v as ListChildrenGender)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Gênero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="M">Meninos</SelectItem>
              <SelectItem value="F">Meninas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={congregationId} onValueChange={setCongregationId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Congregação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {congregations?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : children && children.length > 0 ? (
          children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-white rounded-xl border border-dashed">
            Nenhuma criança encontrada com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
}
