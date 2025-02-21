
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

  const { data: transferRules } = useQuery({
    queryKey: ["transfer-rules", academiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfer_rules")
        .select("*")
        .eq("academia_id", academiaId)
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

  const getNextTransferDate = (days: number[]) => {
    if (!days || days.length === 0) return null;
    
    const today = new Date();
    const currentDay = today.getDate();
    const nextDays = days
      .map(day => {
        const nextDate = new Date(today.getFullYear(), today.getMonth(), day);
        if (day <= currentDay) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        return nextDate;
      })
      .sort((a, b) => a.getTime() - b.getTime());

    return nextDays[0];
  };

  if (loadingActive || loadingHistory) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const nextTransferDate = transferRules?.transfer_days 
    ? getNextTransferDate(transferRules.transfer_days)
    : null;

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

              {nextTransferDate && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">Próximo repasse previsto para:</p>
                  <p className="text-lg font-bold">
                    {nextTransferDate.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
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
