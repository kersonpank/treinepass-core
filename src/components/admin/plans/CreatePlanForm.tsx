
import { useState } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlanDetailsForm } from "./forms/PlanDetailsForm";
import { CheckInRulesForm } from "./forms/CheckInRulesForm";
import { CancellationRulesForm } from "./forms/CancellationRulesForm";
import { FinancingRulesForm } from "./forms/FinancingRulesForm";
import { usePlanForm } from "./hooks/usePlanForm";
import { planFormSchema } from "./types/plan";

interface CreatePlanFormProps {
  onSuccess?: () => void;
}

export function CreatePlanForm({ onSuccess }: CreatePlanFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const { form, isSubmitting, onSubmit } = usePlanForm("new", onSuccess);
  const planType = form.watch("plan_type");
  const isCoFinanced = planType === "corporate_subsidized";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger value="details" className="text-sm">Detalhes</TabsTrigger>
            <TabsTrigger value="checkin" className="text-sm">Check-in</TabsTrigger>
            <TabsTrigger value="payment" className="text-sm">Pagamento</TabsTrigger>
            {isCoFinanced && (
              <TabsTrigger value="financing" className="text-sm">Financiamento</TabsTrigger>
            )}
          </TabsList>

          <div className="mt-4 space-y-4">
            <TabsContent value="details">
              <Card>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[70vh] pr-4">
                    <div className="space-y-4">
                      <PlanDetailsForm form={form} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checkin">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <CheckInRulesForm form={form} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <CancellationRulesForm form={form} />
                </CardContent>
              </Card>
            </TabsContent>

            {isCoFinanced && (
              <TabsContent value="financing">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FinancingRulesForm form={form} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </div>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Plano
          </Button>
        </div>
      </form>
    </Form>
  );
}
