
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueOverview } from "./RevenueOverview";
import { PaymentsList } from "./PaymentsList";
import { BankDetailsForm } from "./BankDetailsForm";
import { TransferRulesForm } from "./TransferRulesForm";
import { PaymentHistoryList } from "./PaymentHistoryList";
import { PayoutCyclesPanel } from "./PayoutCyclesPanel";

interface FinancialPanelProps {
  academiaId: string;
}

export function FinancialPanel({ academiaId }: FinancialPanelProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="cycles">Ciclos de Repasse</TabsTrigger>
        <TabsTrigger value="payments">Pagamentos</TabsTrigger>
        <TabsTrigger value="bank">Dados Bancários</TabsTrigger>
        <TabsTrigger value="rules">Regras de Repasse</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <RevenueOverview academiaId={academiaId} />
        <PaymentHistoryList academiaId={academiaId} />
      </TabsContent>

      <TabsContent value="cycles">
        <PayoutCyclesPanel academiaId={academiaId} />
      </TabsContent>

      <TabsContent value="payments">
        <PaymentsList academiaId={academiaId} />
      </TabsContent>

      <TabsContent value="bank">
        <BankDetailsForm academiaId={academiaId} />
      </TabsContent>

      <TabsContent value="rules">
        <TransferRulesForm academiaId={academiaId} />
      </TabsContent>
    </Tabs>
  );
}
