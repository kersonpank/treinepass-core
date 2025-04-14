
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentData {
  status: string;
  value: number;
  dueDate: string;
  billingType: string;
  invoiceUrl: string;  // Using invoiceUrl consistently
  paymentId: string;
  paymentLink?: string;
  pix?: {
    encodedImage?: string;
    payload?: string;
  };
}

interface BusinessPlanCheckoutDialogProps {
  showCheckout: boolean;
  handleCloseCheckout: () => void;
  checkoutData: PaymentData | null;
  isVerifyingPayment: boolean;
  copiedText: string | null;
  handleCopyToClipboard: (text: string) => void;
}

export function BusinessPlanCheckoutDialog({
  showCheckout,
  handleCloseCheckout,
  checkoutData,
  isVerifyingPayment,
  copiedText,
  handleCopyToClipboard,
}: BusinessPlanCheckoutDialogProps) {
  if (!checkoutData) return null;

  const handleOpenPaymentLink = () => {
    // Use invoiceUrl as the primary link, fallback to paymentLink if needed
    const paymentUrl = checkoutData.invoiceUrl || checkoutData.paymentLink;
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  return (
    <Dialog open={showCheckout} onOpenChange={handleCloseCheckout}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <h2 className="text-xl font-bold">Pagamento do Plano</h2>
          <p className="text-sm text-muted-foreground">
            Complete o pagamento para ativar seu plano
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Valor:</span>
            <span className="font-bold">{formatCurrency(checkoutData.value)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Vencimento:</span>
            <span>{new Date(checkoutData.dueDate).toLocaleDateString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Status:</span>
            <Badge variant={checkoutData.status === 'CONFIRMED' ? 'default' : 'outline'}>
              {checkoutData.status === 'CONFIRMED' ? 'Pago' : 'Pendente'}
            </Badge>
          </div>

          <div className="pt-2">
            <Button 
              onClick={handleOpenPaymentLink} 
              className="w-full"
            >
              Abrir Link de Pagamento
            </Button>
          </div>
          
          {/* Instruction text */}
          <div className="text-sm text-muted-foreground mt-4">
            <p>Após completar o pagamento, seu plano será ativado automaticamente.</p>
            {isVerifyingPayment && (
              <div className="flex items-center mt-2 text-amber-600">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Verificando status do pagamento...</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
