
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentsList } from "./PaymentsList";
import { PaymentSettingsList } from "./PaymentSettingsList";
import { RevenueOverview } from "./RevenueOverview";
import { TransferRulesList } from "./TransferRulesList";

export function PaymentsManagement() {
  return (
    <div className="space-y-4">
      <RevenueOverview />
      
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="transfers">Regras de Repasse</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentSettingsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Repasse</CardTitle>
            </CardHeader>
            <CardContent>
              <TransferRulesList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
