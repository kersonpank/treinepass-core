
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Check, Loader2, RefreshCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useId } from "react";

interface PlanCardProps {
  plan: any;
  isSubscribing: boolean;
  onSubscribe: (planId: string) => void;
  CheckoutDialog: React.ComponentType;
}

export function PlanCard({
  plan,
  isSubscribing,
  onSubscribe,
  CheckoutDialog
}: PlanCardProps) {
  const id = useId();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("pix");
  const [showDialog, setShowDialog] = useState(false);

  const handleConfirmPayment = () => {
    onSubscribe(plan.id);
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Card className="flex flex-col hover:border-primary/50 cursor-pointer transition-all">
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
            
            <ul className="space-y-2 text-sm text-muted-foreground">
              {Object.entries(plan.rules || {}).map(([key, value]) => (
                <li key={key} className="flex gap-2">
                  <Check
                    size={16}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{key}: {JSON.stringify(value)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <div className="mb-2 flex flex-col gap-2">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
            aria-hidden="true"
          >
            <RefreshCcw className="opacity-80" size={16} strokeWidth={2} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">Contratar Plano</DialogTitle>
            <DialogDescription className="text-left">
              Escolha a forma de pagamento para o plano {plan.name}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <RadioGroup 
            className="gap-2" 
            defaultValue="pix"
            value={selectedPaymentMethod}
            onValueChange={setSelectedPaymentMethod}
          >
            <div className="relative flex w-full items-center gap-2 rounded-lg border border-input px-4 py-3 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent">
              <RadioGroupItem
                value="pix"
                id={`${id}-pix`}
                aria-describedby={`${id}-pix-description`}
                className="order-1 after:absolute after:inset-0"
              />
              <div className="grid grow gap-1">
                <Label htmlFor={`${id}-pix`}>PIX</Label>
                <p id={`${id}-pix-description`} className="text-xs text-muted-foreground">
                  Pagamento instantâneo
                </p>
              </div>
            </div>
            <div className="relative flex w-full items-center gap-2 rounded-lg border border-input px-4 py-3 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent">
              <RadioGroupItem
                value="credit_card"
                id={`${id}-credit_card`}
                aria-describedby={`${id}-credit_card-description`}
                className="order-1 after:absolute after:inset-0"
              />
              <div className="grid grow gap-1">
                <Label htmlFor={`${id}-credit_card`}>Cartão de Crédito</Label>
                <p id={`${id}-credit_card-description`} className="text-xs text-muted-foreground">
                  Pagamento recorrente
                </p>
              </div>
            </div>
            <div className="relative flex w-full items-center gap-2 rounded-lg border border-input px-4 py-3 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent">
              <RadioGroupItem
                value="boleto"
                id={`${id}-boleto`}
                aria-describedby={`${id}-boleto-description`}
                className="order-1 after:absolute after:inset-0"
              />
              <div className="grid grow gap-1">
                <Label htmlFor={`${id}-boleto`}>Boleto Bancário</Label>
                <p id={`${id}-boleto-description`} className="text-xs text-muted-foreground">
                  Vencimento em 3 dias úteis
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className="space-y-3">
            <p>
              <strong className="text-sm font-medium">Benefícios inclusos:</strong>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {Object.entries(plan.rules || {}).map(([key, value]) => (
                <li key={key} className="flex gap-2">
                  <Check
                    size={16}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{key}: {JSON.stringify(value)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-2">
            <Button 
              type="button" 
              className="w-full"
              disabled={isSubscribing}
              onClick={handleConfirmPayment}
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="w-full">
                Cancelar
              </Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
