
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailablePlansList } from "@/components/plans/AvailablePlansList";
import { UserSubscriptions } from "@/components/plans/UserSubscriptions";

export function PlansTab() {
  return (
    <Tabs defaultValue="available" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="available">Planos Disponíveis</TabsTrigger>
        <TabsTrigger value="subscriptions">Minhas Assinaturas</TabsTrigger>
      </TabsList>

      <TabsContent value="available" className="mt-4">
        <AvailablePlansList />
      </TabsContent>

      <TabsContent value="subscriptions" className="mt-4">
        <UserSubscriptions />
      </TabsContent>
    </Tabs>
  );
}
