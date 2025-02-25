
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PlanCardProps {
  plan: any;
  isSubscribing: boolean;
  selectedPaymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  onSubscribe: (plan: any) => void;
}

export function PlanCard({
  plan,
  isSubscribing,
  selectedPaymentMethod,
  onPaymentMethodChange,
  onSubscribe,
}: PlanCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{plan.name}</span>
          <span className="text-2xl font-bold">
            {formatCurrency(plan.plan_type === 'corporate_subsidized' ? plan.final_user_cost : plan.monthly_cost)}
            <span className="text-sm font-normal text-muted-foreground">/mês</span>
          </span>
        </CardTitle>
        {plan.plan_type === 'corporate_subsidized' && plan.business_profiles?.company_name && (
          <div className="text-sm text-muted-foreground">
            Plano subsidiado por {plan.business_profiles.company_name}
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

        <div className="space-y-4">
          <Select
            value={selectedPaymentMethod}
            onValueChange={onPaymentMethodChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a forma de pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            className="w-full" 
            onClick={() => onSubscribe(plan)}
            disabled={isSubscribing}
          >
            {isSubscribing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Contratar Plano'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
