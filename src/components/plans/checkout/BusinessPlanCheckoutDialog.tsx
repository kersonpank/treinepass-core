
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Loader2 } from "lucide-react";

interface PaymentData {
  status: string;
  value: number;
  dueDate: string;
  billingType: string;
  invoiceUrl: string;
  paymentId: string;
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
  handleCopyToClipboard
}: BusinessPlanCheckoutDialogProps) {
  return (
    <Dialog open={showCheckout} onOpenChange={handleCloseCheckout}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento</DialogTitle>
          <DialogDescription>
            {checkoutData?.billingType === "PIX" 
              ? "Utilize o QR Code abaixo para realizar o pagamento via PIX" 
              : "Você será redirecionado para a página de pagamento"}
          </DialogDescription>
        </DialogHeader>

        {isVerifyingPayment && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">
                Aguardando confirmação do pagamento...
              </p>
            </div>
          </div>
        )}

        {!checkoutData && (
          <div className="text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Gerando link de pagamento...
            </p>
          </div>
        )}

        {checkoutData && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold">
                Valor: R$ {checkoutData.value.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-sm text-muted-foreground">
                Vencimento: {new Date(checkoutData.dueDate).toLocaleDateString()}
              </p>
            </div>

            {checkoutData.billingType === "PIX" && checkoutData.pix?.encodedImage && (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-2 rounded-lg shadow">
                  <img 
                    src={`data:image/png;base64,${checkoutData.pix.encodedImage}`}
                    alt="QR Code PIX" 
                    className="w-52 h-52"
                  />
                </div>
                
                {checkoutData.pix?.payload && (
                  <div className="w-full space-y-2">
                    <p className="text-xs text-center text-muted-foreground">
                      Ou copie e cole o código PIX abaixo:
                    </p>
                    <div className="flex items-center space-x-2 rounded-md border px-3 py-2 text-xs">
                      <code className="flex-1 break-all">{checkoutData.pix.payload}</code>
                      <button 
                        onClick={() => handleCopyToClipboard(checkoutData.pix?.payload || "")}
                        className="p-1 rounded-md hover:bg-muted"
                      >
                        {copiedText === checkoutData.pix.payload ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {checkoutData.invoiceUrl && checkoutData.billingType !== "PIX" && (
              <Button
                className="w-full"
                onClick={() => window.location.href = checkoutData.invoiceUrl}
              >
                Ir para página de pagamento
              </Button>
            )}
          </div>
        )}

        <DialogClose asChild>
          <Button variant="outline">Fechar</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
