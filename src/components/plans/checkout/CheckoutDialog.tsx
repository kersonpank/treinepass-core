
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PixInfo } from './PixInfo';
import { BoletoInfo } from './BoletoInfo';
import { CreditCardForm } from './CreditCardForm';
import { MercadoPagoCheckout } from './MercadoPagoCheckout';

export interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
  planValue: number;
  paymentMethod: string;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  planId,
  planName,
  planValue,
  paymentMethod = 'pix'
}: CheckoutDialogProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(paymentMethod || 'pix');
  const [isLoading, setIsLoading] = useState(false);

  const handleBackToMethods = () => {
    setSelectedPaymentMethod('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Checkout</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <div className="mb-4 text-center">
            <h3 className="text-lg font-medium">{planName}</h3>
            <p className="text-2xl font-bold">R$ {planValue.toFixed(2)}</p>
          </div>

          {selectedPaymentMethod ? (
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="mb-4"
                onClick={handleBackToMethods}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              {selectedPaymentMethod === 'pix' && (
                <PixInfo planId={planId} planValue={planValue} />
              )}

              {selectedPaymentMethod === 'boleto' && (
                <BoletoInfo planId={planId} planValue={planValue} />
              )}

              {selectedPaymentMethod === 'credit_card' && (
                <CreditCardForm planId={planId} planValue={planValue} />
              )}

              {selectedPaymentMethod === 'mercadopago' && (
                <MercadoPagoCheckout
                  planId={planId}
                  planName={planName}
                  planValue={planValue}
                  onSuccess={() => onOpenChange(false)}
                />
              )}
            </div>
          ) : (
            <Tabs defaultValue="pix">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pix" onClick={() => setSelectedPaymentMethod('pix')}>
                  PIX
                </TabsTrigger>
                <TabsTrigger value="boleto" onClick={() => setSelectedPaymentMethod('boleto')}>
                  Boleto
                </TabsTrigger>
                <TabsTrigger value="credit_card" onClick={() => setSelectedPaymentMethod('credit_card')}>
                  Cartão
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pix">
                <div className="py-4">
                  <p className="text-center mb-4">Pague instantaneamente com PIX</p>
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedPaymentMethod('pix')}
                  >
                    Continuar com PIX
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="boleto">
                <div className="py-4">
                  <p className="text-center mb-4">Receba um boleto para pagamento</p>
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedPaymentMethod('boleto')}
                  >
                    Gerar Boleto
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="credit_card">
                <div className="py-4">
                  <p className="text-center mb-4">Pague com cartão de crédito</p>
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedPaymentMethod('credit_card')}
                  >
                    Continuar com Cartão
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
