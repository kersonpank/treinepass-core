
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentMethodDialog } from "./PaymentMethodDialog";
import { CheckoutDialog } from "./checkout/CheckoutDialog";

interface ContractPlanButtonProps {
  planId: string;
  planName: string;
  planValue: number;
  onSuccess?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function ContractPlanButton({ 
  planId, 
  planName, 
  planValue, 
  onSuccess,
  variant = "default",
  size = "default",
  className = "w-full",
  children
}: ContractPlanButtonProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("pix");

  // Handler para quando o usuário seleciona um método de pagamento
  const handleSelectPaymentMethod = (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPaymentDialog(false);
    setShowCheckout(true);
  };

  // Handler para fechar o diálogo de checkout
  const handleCloseCheckout = () => {
    setShowCheckout(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Button 
        className={className} 
        variant={variant} 
        size={size}
        onClick={() => setShowPaymentDialog(true)}
      >
        {children || "Contratar Plano"}
      </Button>
      
      <PaymentMethodDialog 
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onSelect={handleSelectPaymentMethod}
        planId={planId}
      />
      
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={setShowCheckout}
        planId={planId}
        planName={planName}
        planValue={planValue}
        paymentMethod={selectedPaymentMethod}
      />
    </>
  );
}
