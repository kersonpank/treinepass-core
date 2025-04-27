import { useEffect, useState } from "react";
import { SubscriptionCheckout } from "@/components/subscription/SubscriptionCheckout";
import { useToast } from "@/hooks/use-toast";

// Exemplo de planos de assinatura
const subscriptionPlans = [
  {
    id: "basic",
    name: "Plano Básico",
    description: "Ideal para iniciantes",
    value: 49.90,
    cycle: "MONTHLY",
    features: [
      "Acesso a 10 treinos",
      "Suporte por email",
      "Acesso ao app"
    ],
    externalReference: "plan_basic"
  },
  {
    id: "pro",
    name: "Plano Profissional",
    description: "Para quem quer resultados",
    value: 99.90,
    cycle: "MONTHLY",
    features: [
      "Acesso a todos os treinos",
      "Suporte prioritário",
      "Acesso ao app",
      "Consulta mensal com personal",
      "Plano nutricional"
    ],
    externalReference: "plan_pro"
  },
  {
    id: "premium",
    name: "Plano Premium",
    description: "Experiência completa",
    value: 149.90,
    cycle: "MONTHLY",
    features: [
      "Acesso a todos os treinos",
      "Suporte 24/7",
      "Acesso ao app",
      "Consultas ilimitadas com personal",
      "Plano nutricional personalizado",
      "Acompanhamento exclusivo"
    ],
    externalReference: "plan_premium"
  }
];

export default function SubscriptionExamplePage() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(subscriptionPlans[0]);

  const handleSuccess = (data: any) => {
    console.log("Assinatura criada com sucesso:", data);
    // Aqui você pode implementar a lógica para salvar a assinatura no banco de dados
    // ou redirecionar o usuário para uma página de sucesso
  };

  const handleError = (error: any) => {
    console.error("Erro ao criar assinatura:", error);
    toast({
      variant: "destructive",
      title: "Erro ao processar assinatura",
      description: "Não foi possível processar sua assinatura. Tente novamente mais tarde."
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Escolha seu plano</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {subscriptionPlans.map((plan) => (
          <div 
            key={plan.id} 
            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedPlan.id === plan.id ? 'border-primary bg-primary/5' : 'border-border'}`}
            onClick={() => setSelectedPlan(plan)}
          >
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-muted-foreground">{plan.description}</p>
            <p className="text-2xl font-bold mt-2">
              R$ {plan.value.toFixed(2).replace('.', ',')}
              <span className="text-sm font-normal text-muted-foreground">/mês</span>
            </p>
          </div>
        ))}
      </div>
      
      <div className="max-w-md mx-auto">
        <SubscriptionCheckout 
          plan={selectedPlan} 
          onSuccess={handleSuccess} 
          onError={handleError} 
        />
      </div>
    </div>
  );
}
