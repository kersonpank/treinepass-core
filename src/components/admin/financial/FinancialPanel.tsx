
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueOverview } from "./RevenueOverview";
import { PaymentsList } from "./PaymentsList";
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
    </Tabs>
  );
}
