
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownToLine, ArrowUpToLine, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useParams } from "react-router-dom";

export function FinancialPanel() {
  const { id: academiaId } = useParams();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Buscar dados financeiros do mês
  const { data: checkInsData, isLoading: isLoadingCheckIns } = useQuery({
    queryKey: ["gym-check-ins", selectedMonth, academiaId],
    queryFn: async () => {
      const [startDate, endDate] = getMonthRange(selectedMonth);

      const { data: checkIns, error: checkInsError } = await supabase
        .from("gym_check_ins")
        .select(`
          id,
          valor_repasse,
          check_in_time
        `)
        .eq('academia_id', academiaId)
        .gte("check_in_time", startDate)
        .lt("check_in_time", endDate);

      if (checkInsError) throw checkInsError;

      return checkIns;
    },
    enabled: !!academiaId
  });

  // Buscar histórico de transferências
  const { data: transfers, isLoading: isLoadingTransfers } = useQuery({
    queryKey: ["gym-transfers", academiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asaas_transfers")
        .select("*")
        .eq('academia_id', academiaId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!academiaId
  });

  const getMonthRange = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();
    return [startDate, endDate];
  };

  // Calcular totais
  const totalValue = checkInsData?.reduce((acc, check) => acc + (Number(check.valor_repasse) || 0), 0) || 0;
  const completedTransfers = transfers?.filter(t => t.status === "COMPLETED") || [];
  const paidValue = completedTransfers.reduce((acc, t) => acc + Number(t.amount), 0);
  const pendingValue = totalValue - paidValue;

  if (isLoadingCheckIns || isLoadingTransfers) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financeiro</h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {getLastTwelveMonths().map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Check-ins
            </CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {checkInsData?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total
            </CardTitle>
            <ArrowUpToLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Pendente
            </CardTitle>
            <ArrowUpToLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pendingValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transferências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Transferência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers?.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      {new Date(transfer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{formatCurrency(transfer.amount)}</TableCell>
                    <TableCell>
                      <span className={getStatusColor(transfer.status)}>
                        {getStatusLabel(transfer.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transfer.transfer_date
                        ? new Date(transfer.transfer_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getLastTwelveMonths() {
  const months = [];
  const today = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }
  
  return months;
}

function getStatusColor(status: string) {
  const colors = {
    PENDING: "text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full",
    COMPLETED: "text-green-600 bg-green-100 px-2 py-1 rounded-full",
    FAILED: "text-red-600 bg-red-100 px-2 py-1 rounded-full",
  } as const;
  
  return colors[status as keyof typeof colors] || "text-gray-600 bg-gray-100 px-2 py-1 rounded-full";
}

function getStatusLabel(status: string) {
  const labels = {
    PENDING: "Pendente",
    COMPLETED: "Concluído",
    FAILED: "Falhou",
  } as const;
  
  return labels[status as keyof typeof labels] || status;
}
