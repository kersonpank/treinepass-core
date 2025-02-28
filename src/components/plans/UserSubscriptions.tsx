
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-amber-100 text-amber-700",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
  refunded: "bg-purple-100 text-purple-700",
};

const statusLabels = {
  active: "Ativo",
  pending: "Pendente",
  overdue: "Vencido",
  expired: "Expirado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export function UserSubscriptions() {
  const { toast } = useToast();

  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ["userSubscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_plan_subscriptions")
        .select(`
          *,
          benefit_plans (
            name,
            description,
            monthly_cost,
            rules
          ),
          asaas_payments (
            asaas_id,
            amount,
            billing_type,
            status,
            due_date,
            payment_link
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar assinaturas",
          description: error.message,
        });
        throw error;
      }
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Erro ao carregar assinaturas. Por favor, tente novamente.
        </CardContent>
      </Card>
    );
  }

  if (!subscriptions?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Você ainda não possui nenhuma assinatura.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => (
        <Card key={subscription.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{subscription.benefit_plans.name}</CardTitle>
              <Badge className={statusColors[subscription.status] || statusColors.pending}>
                {statusLabels[subscription.status] || "Pendente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor mensal:</span>
              <span className="font-medium">
                {formatCurrency(subscription.benefit_plans.monthly_cost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Início:</span>
              <span>{new Date(subscription.start_date).toLocaleDateString()}</span>
            </div>
            {subscription.end_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Término:</span>
                <span>{new Date(subscription.end_date).toLocaleDateString()}</span>
              </div>
            )}
            {subscription.payment_status === 'pending' && subscription.asaas_payments?.length > 0 && (
              <div className="mt-4">
                <a 
                  href={subscription.asaas_payments[0]?.payment_link} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-primary text-white rounded-md py-2 mt-2 hover:bg-primary/90 transition-colors"
                >
                  Realizar Pagamento
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
