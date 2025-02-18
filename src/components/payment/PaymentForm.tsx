
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentFormProps {
  planId: string;
  amount: number;
  onSuccess: () => void;
}

type PaymentMethod = "CREDIT_CARD" | "BOLETO" | "PIX";

interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export function PaymentForm({ planId, amount, onSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CREDIT_CARD");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<CreditCardData>();

  const processPayment = async (creditCardData?: CreditCardData) => {
    setIsProcessing(true);
    try {
      const { data: customerId } = await supabase.auth.getUser();
      
      if (!customerId.user) {
        throw new Error("Usuário não autenticado");
      }

      const { data: payment, error } = await supabase.functions.invoke("process-payment", {
        body: {
          customerId: customerId.user.id,
          planId,
          billingType: paymentMethod,
          ...(creditCardData && { creditCard: creditCardData }),
        },
      });

      if (error) throw error;

      toast({
        title: "Pagamento processado!",
        description: "Seu pagamento foi processado com sucesso.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no pagamento",
        description: error.message || "Ocorreu um erro ao processar o pagamento.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento - R$ {amount.toFixed(2)}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(processPayment)} className="space-y-6">
          <RadioGroup
            defaultValue={paymentMethod}
            onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CREDIT_CARD" id="credit-card" />
              <Label htmlFor="credit-card">Cartão de Crédito</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="BOLETO" id="boleto" />
              <Label htmlFor="boleto">Boleto</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PIX" id="pix" />
              <Label htmlFor="pix">PIX</Label>
            </div>
          </RadioGroup>

          {paymentMethod === "CREDIT_CARD" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="holderName">Nome no Cartão</Label>
                <Input
                  id="holderName"
                  {...register("holderName", { required: "Nome é obrigatório" })}
                />
                {errors.holderName && (
                  <p className="text-sm text-red-500 mt-1">{errors.holderName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="number">Número do Cartão</Label>
                <Input
                  id="number"
                  {...register("number", { required: "Número é obrigatório" })}
                />
                {errors.number && (
                  <p className="text-sm text-red-500 mt-1">{errors.number.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expiryMonth">Mês</Label>
                  <Input
                    id="expiryMonth"
                    {...register("expiryMonth", { required: "Mês é obrigatório" })}
                  />
                  {errors.expiryMonth && (
                    <p className="text-sm text-red-500 mt-1">{errors.expiryMonth.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="expiryYear">Ano</Label>
                  <Input
                    id="expiryYear"
                    {...register("expiryYear", { required: "Ano é obrigatório" })}
                  />
                  {errors.expiryYear && (
                    <p className="text-sm text-red-500 mt-1">{errors.expiryYear.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ccv">CCV</Label>
                  <Input
                    id="ccv"
                    type="password"
                    maxLength={4}
                    {...register("ccv", { required: "CCV é obrigatório" })}
                  />
                  {errors.ccv && (
                    <p className="text-sm text-red-500 mt-1">{errors.ccv.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? "Processando..." : "Finalizar Pagamento"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
