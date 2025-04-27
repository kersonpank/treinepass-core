import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionPlanProps {
  id: string;
  name: string;
  description: string;
  value: number;
  cycle: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
  features: string[];
  externalReference?: string;
}

interface SubscriptionCheckoutProps {
  plan: SubscriptionPlanProps;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function SubscriptionCheckout({ plan, onSuccess, onError }: SubscriptionCheckoutProps) {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { createSubscription, prepareCustomerDataFromProfile, isLoading } = useSubscription();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!user || !profile) {
      toast({
        variant: "destructive",
        title: "Erro ao assinar",
        description: "Você precisa estar logado para assinar um plano."
      });
      return;
    }

    try {
      // Preparar dados do cliente a partir do perfil do usuário
      const customerData = prepareCustomerDataFromProfile(profile);
      
      // Criar assinatura
      const result = await createSubscription({
        customerData,
        plan: {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          value: plan.value,
          cycle: plan.cycle,
          externalReference: plan.externalReference || `plan_${plan.id}`
        },
        // Próximo vencimento em 7 dias (padrão)
        nextDueDate: new Date(new Date().setDate(new Date().getDate() + 7))
      });

      if (result.success) {
        // Se tiver URL de checkout, redirecionar
        if (result.paymentLink || result.invoiceUrl) {
          const checkoutUrl = result.paymentLink || result.invoiceUrl;
          setCheckoutUrl(checkoutUrl);
          
          // Abrir em uma nova aba
          window.open(checkoutUrl, "_blank");
          
          toast({
            title: "Assinatura criada com sucesso",
            description: "Você será redirecionado para o checkout do Asaas."
          });
          
          // Chamar callback de sucesso se fornecido
          if (onSuccess) {
            onSuccess(result);
          }
        } else {
          toast({
            variant: "destructive",
            title: "Erro ao processar assinatura",
            description: "Não foi possível obter o link de pagamento."
          });
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
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-3xl font-bold">
            R$ {plan.value.toFixed(2).replace('.', ',')}
            <span className="text-sm font-normal text-muted-foreground">
              {plan.cycle === "MONTHLY" && "/mês"}
              {plan.cycle === "YEARLY" && "/ano"}
              {plan.cycle === "QUARTERLY" && "/trimestre"}
              {plan.cycle === "SEMIANNUALLY" && "/semestre"}
              {plan.cycle === "WEEKLY" && "/semana"}
              {plan.cycle === "BIWEEKLY" && "/quinzena"}
            </span>
          </div>
          
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 mr-2 text-green-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        {checkoutUrl ? (
          <div className="w-full space-y-4">
            <Button
              className="w-full"
              onClick={() => window.open(checkoutUrl, "_blank")}
            >
              Abrir checkout novamente
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              O checkout do Asaas foi aberto em uma nova aba. Se não abriu automaticamente,
              clique no botão acima.
            </p>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Assinar agora"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
