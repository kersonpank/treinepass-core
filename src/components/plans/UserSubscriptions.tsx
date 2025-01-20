import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const statusColors = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export function UserSubscriptions() {
  const { data: subscriptions, isLoading } = useQuery({
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
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
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
              <Badge className={statusColors[subscription.status]}>
                {subscription.status === "active" ? "Ativo" :
                 subscription.status === "pending" ? "Pendente" :
                 subscription.status === "expired" ? "Expirado" : "Cancelado"}
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}