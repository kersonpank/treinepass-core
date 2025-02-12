import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

export function CheckInHistory() {
  const { id: academiaId } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: checkIns, isLoading } = useQuery({
    queryKey: ["check-ins-history", academiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gym_check_ins")
        .select(`
          *,
          user:user_id (
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
    // Subscribe to real-time updates for check-ins
    const channel = supabase
      .channel('public:gym_check_ins')
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
          // Show toast for new check-ins
          toast.toast({
            title: "Histórico atualizado",
            description: "Um novo check-in foi registrado",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [academiaId, queryClient, toast]);

  const totalRepasse = checkIns?.reduce((sum, checkIn) => sum + (checkIn.valor_repasse || 0), 0) || 0;

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
      <CardHeader>
        <CardTitle>Histórico de Check-ins</CardTitle>
        <div className="text-sm text-muted-foreground">
          Valor total de repasse: R$ {totalRepasse.toFixed(2)}
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
