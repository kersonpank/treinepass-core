
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function TransfersList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: transfers, isLoading } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asaas_transfers")
        .select(`
          *,
          academia:academias(nome, cnpj)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const { mutate: processTransfer } = useMutation({
    mutationFn: async (transferId: string) => {
      const { data, error } = await supabase.functions.invoke(
        "process-transfer",
        { body: { transferId } }
      );
      if (error) throw error;
      return data;
    },
    onMutate: (transferId) => {
      setProcessingId(transferId);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Repasse processado com sucesso"
      });
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao processar repasse",
        description: error.message
      });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Academia</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mês Referência</TableHead>
            <TableHead>Data Transferência</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers?.map((transfer) => (
            <TableRow key={transfer.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span>{transfer.academia?.nome}</span>
                  <span className="text-sm text-muted-foreground">
                    {transfer.academia?.cnpj}
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatCurrency(transfer.amount)}</TableCell>
              <TableCell>
                <Badge variant={
                  transfer.status === "COMPLETED" ? "default" : 
                  transfer.status === "PENDING" ? "secondary" : 
                  "destructive"
                }>
                  {transfer.status === "COMPLETED" ? "Concluído" :
                   transfer.status === "PENDING" ? "Pendente" :
                   "Falhou"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(transfer.reference_month).toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </TableCell>
              <TableCell>
                {transfer.transfer_date ? 
                  new Date(transfer.transfer_date).toLocaleDateString() : 
                  "-"
                }
              </TableCell>
              <TableCell className="text-right">
                {transfer.status === "PENDING" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => processTransfer(transfer.id)}
                    disabled={!!processingId}
                  >
                    {processingId === transfer.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Processar"
                    )}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
