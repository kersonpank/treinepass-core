
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentSettingsForm } from "./PaymentSettingsForm";
import type { PaymentSettings } from "./types/payment";

export function PaymentSettingsList() {
  const [selectedSetting, setSelectedSetting] = useState<PaymentSettings | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_payment_settings")
        .select(`
          *,
          benefit_plans (
            name,
            plan_type
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
              <TableHead>Plano</TableHead>
              <TableHead>Tipo de Cobrança</TableHead>
              <TableHead>Dia Vencimento</TableHead>
              <TableHead>Tentativas</TableHead>
              <TableHead>Retry</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings?.map((setting) => (
              <TableRow key={setting.id}>
                <TableCell>{setting.benefit_plans?.name}</TableCell>
                <TableCell>{setting.billing_type}</TableCell>
                <TableCell>{setting.due_day}</TableCell>
                <TableCell>{setting.max_retry_attempts}</TableCell>
                <TableCell>{setting.automatic_retry ? "Sim" : "Não"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedSetting(setting);
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
              {selectedSetting ? "Editar Configuração" : "Nova Configuração"}
            </DialogTitle>
          </DialogHeader>
          <PaymentSettingsForm
            setting={selectedSetting}
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
