
import { useState } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="payment">Pagamento</TabsTrigger>
            {isCoFinanced && (
              <TabsTrigger value="financing">Financiamento</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <PlanDetailsForm form={form} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkin" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <CheckInRulesForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <CancellationRulesForm />
              </CardContent>
            </Card>
          </TabsContent>

          {isCoFinanced && (
            <TabsContent value="financing" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <FinancingRulesForm />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Plano
        </Button>
      </form>
    </Form>
  );
}
