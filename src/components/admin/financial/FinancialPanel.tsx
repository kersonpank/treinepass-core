
import { useEffect, useState } from "react";
import { BankDetailsForm } from "./BankDetailsForm";
import { TransferRulesForm } from "./TransferRulesForm";
import { PaymentHistoryList } from "./PaymentHistoryList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FinancialPanelProps {
  academiaId: string;
}

export function FinancialPanel({ academiaId }: FinancialPanelProps) {
  const { toast } = useToast();
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [transferRules, setTransferRules] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [academiaId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Carregar dados bancários
      const { data: bankData, error: bankError } = await supabase
        .from('academia_dados_bancarios')
        .select('*')
        .eq('academia_id', academiaId)
        .maybeSingle();

      if (bankError) throw bankError;
      setBankDetails(bankData);

      // Carregar regras de transferência
      const { data: rulesData, error: rulesError } = await supabase
        .from('transfer_rules')
        .select('*')
        .eq('academia_id', academiaId)
        .maybeSingle();

      if (rulesError) throw rulesError;
      setTransferRules(rulesData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados financeiros",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BankDetailsForm
        academiaId={academiaId}
        initialData={bankDetails}
        onSuccess={loadData}
      />

      <TransferRulesForm
        academiaId={academiaId}
        initialData={transferRules}
        onSuccess={loadData}
      />

      <PaymentHistoryList academiaId={academiaId} />
    </div>
  );
}
