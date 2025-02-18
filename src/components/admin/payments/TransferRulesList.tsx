
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransferRulesForm } from "./TransferRulesForm";
import type { TransferRule } from "./types/payment";

export function TransferRulesList() {
  const [selectedRule, setSelectedRule] = useState<TransferRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: rules, isLoading, refetch } = useQuery({
    queryKey: ["transfer-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfer_rules")
        .select(`
          *,
          academias (
            nome
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Academia</TableHead>
              <TableHead>Valor Mínimo</TableHead>
              <TableHead>Dia do Repasse</TableHead>
              <TableHead>Repasse Automático</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules?.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.academias?.nome}</TableCell>
                <TableCell>R$ {rule.minimum_transfer_amount}</TableCell>
                <TableCell>Dia {rule.transfer_day}</TableCell>
                <TableCell>{rule.automatic_transfer ? "Sim" : "Não"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedRule(rule);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? "Editar Regra" : "Nova Regra"}
            </DialogTitle>
          </DialogHeader>
          <TransferRulesForm
            rule={selectedRule}
            onSuccess={() => {
              setIsDialogOpen(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
