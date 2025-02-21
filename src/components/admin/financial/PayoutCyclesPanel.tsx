
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface PayoutCyclesPanelProps {
  academiaId: string;
}

export function PayoutCyclesPanel({ academiaId }: PayoutCyclesPanelProps) {
  const { toast } = useToast();

  const { data: activeCycle, isLoading: loadingActive } = useQuery({
    queryKey: ["active-payout-cycle", academiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gym_payout_cycles")
        .select("*")
        .eq("academia_id", academiaId)
        .eq("status", "active")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: cyclesHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["payout-cycles-history", academiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gym_payout_cycles")
        .select("*, asaas_transfers(*)")
        .eq("academia_id", academiaId)
        .neq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleCompleteCycle = async () => {
    if (!activeCycle?.id) return;

    try {
      const { data, error } = await supabase.rpc(
        "complete_payout_cycle",
        { p_cycle_id: activeCycle.id }
      );

      if (error) throw error;

      toast({
        title: "Ciclo finalizado",
        description: "Um novo ciclo foi iniciado automaticamente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao finalizar ciclo",
        description: error.message,
      });
    }
  };

  if (loadingActive || loadingHistory) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ciclo Atual</CardTitle>
        </CardHeader>
        <CardContent>
          {activeCycle ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Check-ins</p>
                  <p className="text-2xl font-bold">{activeCycle.check_ins_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(activeCycle.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Início do Ciclo</p>
                  <p className="text-2xl font-bold">
                    {new Date(activeCycle.start_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button onClick={handleCompleteCycle}>Finalizar Ciclo</Button>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Nenhum ciclo ativo encontrado</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ciclos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Check-ins</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cyclesHistory?.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell>
                    {new Date(cycle.start_date).toLocaleDateString()} -{" "}
                    {cycle.end_date
                      ? new Date(cycle.end_date).toLocaleDateString()
                      : "Em andamento"}
                  </TableCell>
                  <TableCell>{cycle.check_ins_count}</TableCell>
                  <TableCell>{formatCurrency(cycle.total_amount)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        cycle.asaas_transfers?.status === "COMPLETED" 
                          ? "default"
                          : "secondary"
                      }
                    >
                      {cycle.asaas_transfers?.status || "Pendente"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!cyclesHistory || cyclesHistory.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhum ciclo finalizado encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
