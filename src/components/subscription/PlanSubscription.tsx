import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Importar o tipo de usuário e perfil
interface User {
  id: string;
  email: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  phone?: string;
  phone_number?: string;
  postal_code?: string;
  address?: string;
  address_number?: string;
  complement?: string;
  neighborhood?: string;
}

// Hook simplificado de autenticação para este componente
function useAuth() {
  // Normalmente você teria um hook real que obtém o usuário atual
  // Para este exemplo, vamos usar um mock
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Carregar o usuário atual do Supabase quando o componente montar
  useState(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Carregar o perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setProfile(profile);
        }
      }
    }
    
    loadUser();
  }, []);
  
  return { user, profile };
}

interface Plan {
  id: string;
  name: string;
  description?: string;
  monthly_cost: string;
  plan_type: string;
  period_type: string;
  status: string;
  payment_methods?: string[];
}

interface PlanSubscriptionProps {
  plan: Plan;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  buttonLabel?: string;
  buttonClassName?: string;
  isBusinessPlan?: boolean;
}

/**
 * Componente para assinar um plano existente do TreinePass usando o Asaas
 */
export function PlanSubscription({
  plan,
  onSuccess,
  onError,
  buttonLabel = "Assinar agora",
  buttonClassName = "",
  isBusinessPlan = false
}: PlanSubscriptionProps) {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { createSubscription, prepareCustomerDataFromProfile, isLoading } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (!user || !profile) {
      toast({
        variant: "destructive",
        title: "Erro ao assinar",
        description: "Vocu00ea precisa estar logado para assinar um plano."
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Preparar dados do cliente a partir do perfil do usuu00e1rio
      const customerData = prepareCustomerDataFromProfile(profile);
      
      // Mapear o tipo de peru00edodo para o ciclo do Asaas
      const cycleMap: Record<string, "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY" | "WEEKLY" | "BIWEEKLY"> = {
        "monthly": "MONTHLY",
        "quarterly": "QUARTERLY",
        "semiannual": "SEMIANNUALLY",
        "annual": "YEARLY"
      };
      
      // Criar assinatura no Asaas
      const result = await createSubscription({
        customerData,
        plan: {
          id: plan.id,
          name: plan.name,
          description: plan.description || `Assinatura ${plan.name}`,
          value: parseFloat(plan.monthly_cost),
          cycle: cycleMap[plan.period_type] || "MONTHLY",
          // Garantir que estamos passando os métodos de pagamento permitidos
          billingTypes: ["BOLETO", "CREDIT_CARD", "PIX"],
          externalReference: plan.id
        },
        // Pru00f3ximo vencimento em 7 dias (padru00e3o)
        nextDueDate: new Date(new Date().setDate(new Date().getDate() + 7))
      });

      if (result.success) {
        // Salvar a assinatura no banco de dados
        const subscriptionData = {
          user_id: user.id,
          plan_id: plan.id,
          status: "pending", // Inicialmente pendente atu00e9 confirmau00e7u00e3o do pagamento
          payment_status: "pending",
          start_date: new Date().toISOString(),
          next_payment_date: result.nextDueDate,
          external_reference: plan.id, // Usado para rastrear no webhook
          asaas_subscription_id: result.subscriptionId,
          asaas_customer_id: result.customerId,
          payment_method: "asaas",
          payment_link: result.paymentLink || result.invoiceUrl
        };
        
        // Salvar na tabela apropriada
        const { data: savedSubscription, error: saveError } = await supabase
          .from(isBusinessPlan ? 'business_plan_subscriptions' : 'user_plan_subscriptions')
          .insert(subscriptionData)
          .select()
          .single();
        
        if (saveError) {
          console.error("Erro ao salvar assinatura:", saveError);
          toast({
            variant: "destructive",
            title: "Erro ao salvar assinatura",
            description: "A assinatura foi criada no Asaas, mas nu00e3o foi possu00edvel salvar no sistema."
          });
        } else {
          // Se tiver URL de checkout, redirecionar
          if (result.paymentLink || result.invoiceUrl) {
            const checkoutUrl = result.paymentLink || result.invoiceUrl;
            
            // Abrir em uma nova aba
            window.open(checkoutUrl, "_blank");
            
            toast({
              title: "Assinatura criada com sucesso",
              description: "Vocu00ea seru00e1 redirecionado para o checkout do Asaas."
            });
            
            // Chamar callback de sucesso se fornecido
            if (onSuccess) {
              onSuccess({
                ...result,
                subscription: savedSubscription
              });
            }
          } else {
            toast({
              variant: "destructive",
              title: "Erro ao processar assinatura",
              description: "Nu00e3o foi possu00edvel obter o link de pagamento."
            });
          }
        }
      } else {
        // Tratar erro
        console.error("Erro ao criar assinatura:", result.error);
        toast({
          variant: "destructive",
          title: "Erro ao criar assinatura",
          description: result.error?.message || "Ocorreu um erro ao processar sua assinatura."
        });
        
        // Chamar callback de erro se fornecido
        if (onError) {
          onError(result.error);
        }
      }
    } catch (error: any) {
      console.error("Erro ao processar assinatura:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar assinatura",
        description: error.message || "Ocorreu um erro ao processar sua assinatura."
      });
      
      // Chamar callback de erro se fornecido
      if (onError) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleSubscribe}
      disabled={isProcessing || isLoading}
      className={buttonClassName}
    >
      {isProcessing || isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        buttonLabel
      )}
    </Button>
  );
}
