import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
<<<<<<< HEAD
=======
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
>>>>>>> main
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { CheckInSummary } from "./components/CheckInSummary";
import { CheckInsTable } from "./components/CheckInsTable";
import { CheckInHistoryItem } from "@/types/check-in";
import { useToast } from "@/hooks/use-toast";

export function CheckInHistory() {
  const { id: academiaId } = useParams();
  const queryClient = useQueryClient();
<<<<<<< HEAD
  const { toast } = useToast();
=======
  const toast = useToast();
>>>>>>> main

  const { data: checkIns, isLoading } = useQuery<CheckInHistoryItem[]>({
    queryKey: ["check-ins-history", academiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gym_check_ins")
        .select(`
          *,
          user:user_profiles (
            full_name,
            email,
            cpf
          ),
          plano:plano_id (
            name,
            plan_type
          ),
          financial_record:gym_check_in_financial_records (
            valor_plano,
            status_pagamento
          )
        `)
        .eq('academia_id', academiaId)
        .order("check_in_time", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!academiaId) return;

    // Subscribe to real-time updates for check-ins
    const channel = supabase
      .channel('gym_check_ins')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'gym_check_ins',
          filter: `academia_id=eq.${academiaId}`
        },
        () => {
          // Invalidate and refetch the check-ins query
          queryClient.invalidateQueries({ queryKey: ["check-ins-history", academiaId] });
<<<<<<< HEAD
          toast({
            title: "Novo check-in",
            description: "Um novo check-in foi registrado!",
=======
          // Show toast for new check-ins
          toast.toast({
            title: "Histórico atualizado",
            description: "Um novo check-in foi registrado",
>>>>>>> main
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [academiaId, queryClient, toast]);
<<<<<<< HEAD
=======

  const totalRepasse = checkIns?.reduce((sum, checkIn) => sum + (checkIn.valor_repasse || 0), 0) || 0;
>>>>>>> main

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Check-ins</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CheckInSummary checkIns={checkIns || []} />
      <CardContent>
<<<<<<< HEAD
        <CheckInsTable checkIns={checkIns || []} />
=======
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Repasse</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkIns?.map((checkIn) => (
                <TableRow key={checkIn.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{checkIn.user?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{checkIn.user?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{checkIn.user?.cpf}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{checkIn.plano?.name}</div>
                      <Badge variant="outline">{checkIn.plano?.plan_type}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(checkIn.check_in_time), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {checkIn.validation_method === "automatic" ? "Automático" : "Manual"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={checkIn.status === "active" ? "success" : "destructive"}
                    >
                      {checkIn.status === "active" ? "Ativo" : "Cancelado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {checkIn.valor_repasse?.toFixed(2) || "0.00"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
>>>>>>> main
      </CardContent>
    </Card>
  );
}
