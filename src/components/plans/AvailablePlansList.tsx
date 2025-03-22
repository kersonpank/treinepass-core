import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plan } from "./types/plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
<<<<<<< HEAD

export function AvailablePlansList() {
=======
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

>>>>>>> main
  const { data: plans, isLoading } = useQuery({
    queryKey: ["available-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_plans")
        .select("*")
        .eq("status", "active");

      if (error) throw error;

      return data.map(plan => ({
        ...plan,
        financing_rules: plan.financing_rules as {
          type: string;
          contribution_type: string;
          employee_contribution: number;
          company_contribution: number;
        }
      }));
    },
  });

<<<<<<< HEAD
=======
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

>>>>>>> main
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planos Disponíveis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plans?.map((plan: Plan) => (
            <div key={plan.id} className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p>{plan.description}</p>
                <p>{formatCurrency(Number(plan.monthly_cost))} / {plan.period_type}</p>
              </div>
              <Button onClick={() => console.log(`Selected plan: ${plan.id}`)}>Selecionar</Button>
            </div>
<<<<<<< HEAD
          ))}
        </div>
      </CardContent>
    </Card>
=======

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
>>>>>>> main
  );
}
