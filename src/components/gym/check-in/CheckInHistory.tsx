
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
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
          event: 'INSERT',
          schema: 'public',
          table: 'gym_check_ins',
          filter: `academia_id=eq.${academiaId}`
        },
        () => {
          // Invalidate and refetch the check-ins query
          queryClient.invalidateQueries({ queryKey: ["check-ins-history", academiaId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [academiaId, queryClient]);

  const totalRepasse = checkIns?.reduce((sum, checkIn) => sum + (checkIn.valor_repasse || 0), 0) || 0;

  if (isLoading) {
    return <div>Carregando histórico...</div>;
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
                      <div className="font-medium">{checkIn.user?.full_name || "Usuário não encontrado"}</div>
                      <div className="text-sm text-muted-foreground">{checkIn.user?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{checkIn.user?.cpf}</TableCell>
                  <TableCell>
                    {format(new Date(checkIn.check_in_time), "PPpp", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {checkIn.validation_method === "qr_code"
                        ? "QR Code"
                        : "Código Manual"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={checkIn.check_out_time ? "secondary" : "default"}
                    >
                      {checkIn.check_out_time ? "Finalizado" : "Ativo"}
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
