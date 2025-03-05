import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { PaymentMethodDialog } from "./PaymentMethodDialog";
import { Database } from '@/integrations/supabase/types';

type Plan = Database['public']['Tables']['benefit_plans']['Row'];

export function AvailablePlansList() {
  const { toast } = useToast();
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["availablePlans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*, business_profiles(company_name)")
        .eq("status", "active")
        .or("plan_type.eq.individual,plan_type.eq.corporate_subsidized")
        .order("monthly_cost");

      if (error) throw error;
      return data;
    },
  });

  const handlePaymentMethod = async (planId: string) => {
    try {
      setLoading(true);

      // Buscar dados do usuário
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Buscar plano
      const { data: plan, error: planError } = await supabase
        .from('benefit_plans')
        .select('*')
        .eq('id', planId)
        .single();
      if (planError) throw planError;

      // Criar cliente no Asaas se não existir
      const { data: existingCustomer } = await supabase
        .from('asaas_customers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      let asaasCustomerId;
      if (existingCustomer) {
        asaasCustomerId = existingCustomer.asaas_id;
      } else {
        const { data: customerData, error: customerError } = await supabase.rpc('asaas_api', {
          action: 'createCustomer',
          data: {
            name: user.user_metadata.full_name,
            email: user.email,
            cpfCnpj: user.user_metadata.cpf
          }
        });
        if (customerError) throw customerError;

        const { data: newCustomer, error: insertError } = await supabase
          .from('asaas_customers')
          .insert({
            user_id: user.id,
            asaas_id: customerData.id,
            name: user.user_metadata.full_name,
            email: user.email,
            cpf_cnpj: user.user_metadata.cpf
          })
          .select()
          .single();
        if (insertError) throw insertError;

        asaasCustomerId = customerData.id;
      }

      // Criar assinatura como pendente
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_plan_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: 'pending',
          payment_status: 'pending',
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
        })
        .select()
        .single();
      if (subscriptionError) throw subscriptionError;

      // Criar assinatura no Asaas
      console.log('Criando assinatura no Asaas:', {
        customer: asaasCustomerId,
        value: plan.monthly_cost,
        description: plan.description || `Assinatura mensal do plano ${plan.name}`,
        externalReference: subscription.id
      });

      const { data: asaasSubscription, error: asaasError } = await supabase.rpc('asaas_api', {
        action: 'createSubscription',
        data: {
          customer: asaasCustomerId,
          value: plan.monthly_cost,
          description: plan.description || `Assinatura mensal do plano ${plan.name}`,
          externalReference: subscription.id
        }
      });
      if (asaasError) throw asaasError;

      console.log('Resposta do Asaas:', asaasSubscription);

      // Verificar se temos a URL de pagamento
      if (!asaasSubscription?.invoiceUrl) {
        throw new Error('URL de pagamento não disponível na resposta do Asaas');
      }

      // Salvar o pagamento
      const { error: savePaymentError } = await supabase
        .from('asaas_payments')
        .insert({
          asaas_id: asaasSubscription.id,
          customer_id: existingCustomer.id,
          subscription_id: subscription.id,
          amount: plan.monthly_cost,
          billing_type: 'UNDEFINED',
          status: 'PENDING',
          due_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
          payment_link: asaasSubscription.invoiceUrl
        });
      if (savePaymentError) throw savePaymentError;

      console.log('Redirecionando para:', asaasSubscription.invoiceUrl);

      // Redirecionar para o link de pagamento
      window.location.href = asaasSubscription.invoiceUrl;
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      
      let errorMessage = 'Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente.';
      
      if (error.message) {
        if (error.message.includes('URL de pagamento não disponível')) {
          errorMessage = 'Não foi possível gerar o link de pagamento. Por favor, tente novamente.';
        } else if (error.message.includes('Nenhum pagamento encontrado')) {
          errorMessage = 'Não foi possível criar a cobrança. Por favor, tente novamente.';
        }
      }

      toast({
        title: 'Erro ao processar pagamento',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans?.map((plan) => (
        <Card key={plan.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{plan.name}</span>
              <span className="text-2xl font-bold">
                {formatCurrency(plan.plan_type === 'corporate_subsidized' ? plan.final_user_cost : plan.monthly_cost)}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </span>
            </CardTitle>
            {plan.plan_type === 'corporate_subsidized' && (
              <div className="text-sm text-muted-foreground">
                Plano subsidiado por {plan.business_profiles?.company_name}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-sm text-muted-foreground">{plan.description}</p>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Benefícios inclusos:</h4>
              <ul className="space-y-2 text-sm">
                {Object.entries(plan.rules || {}).map(([key, value]) => (
                  <li key={key} className="flex items-center">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="ml-1">{JSON.stringify(value)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button 
              className="w-full" 
              onClick={() => handlePaymentMethod(plan.id)}
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Contratar Plano'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}