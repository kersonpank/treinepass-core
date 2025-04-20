import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Copy, RefreshCw, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { differenceInSeconds, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Plan {
  id: string;
  name: string;
  monthly_cost: number;
  final_user_cost?: number;
  plan_type: string;
  description: string;
  rules: any;
}

interface CheckoutDialogProps {
  show: boolean;
  onClose: () => void;
  plan: Plan | null;
  profileData: any;
}

// Memo para evitar o erro de React Static Flag
const MemoizedCheckoutDialog = memo(CheckoutDialogComponent);
export { MemoizedCheckoutDialog as CheckoutDialog };

function CheckoutDialogComponent({ show, onClose, plan, profileData }: CheckoutDialogProps) {
  if (!plan) return null;

  const [step, setStep] = useState<'select' | 'processing' | 'result'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Contador regressivo para expiração do PIX
  useEffect(() => {
    if (!result || !result.expirationDate || paymentMethod !== 'PIX') return;

    const updateCountdown = () => {
      const now = new Date();
      const expirationDate = new Date(result.expirationDate);
      const secondsRemaining = differenceInSeconds(expirationDate, now);
      
      if (secondsRemaining <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
      } else {
        setIsExpired(false);
        setTimeLeft(secondsRemaining);
      }
    };

    // Executa imediatamente e depois a cada segundo
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [result, paymentMethod]);

  const formatTimeLeft = () => {
    if (timeLeft === null) return '';
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleInitiate = async (method: 'PIX' | 'CREDIT_CARD') => {
    if (!plan || !profileData) return;
    
    setPaymentMethod(method);
    setStep('processing');
    setError(null);
    setIsExpired(false);
    setPaymentSuccess(false);
    
    try {
      // Calcular o preço correto do plano
      const planPrice = plan.monthly_cost || plan.final_user_cost || 0;
      
      // Dados comuns para ambos os métodos de pagamento
      const commonData = {
        planId: plan.id,
        customerData: profileData,
        planName: plan.name,
        value: planPrice,
        description: `Assinatura ${plan.name}`,
        externalReference: crypto.randomUUID(),
        callback: {
          successUrl: window.location.origin + '/payment/success',
          failureUrl: window.location.origin + '/payment/failure'
        }
      };
      
      let result;
      
      if (method === 'CREDIT_CARD') {
        // Para cartão de crédito, usar a implementação original com redirecionamento
        console.log('Usando checkout do Asaas para cartão de crédito');
        
        // Enviar para a Edge Function original mas especificando CREDIT_CARD como método
        const data = {
          ...commonData,
          paymentMethod: method
        };
        
        console.log('Enviando dados para a Edge Function (Cartão):', data);
        
        const { data: paymentResult, error: invokeError } = await supabase.functions.invoke('asaas-api', {
          body: { action: 'initiateCheckout', data }
        });
        
        if (invokeError) {
          console.error('Erro na Edge Function (Cartão):', invokeError);
          throw new Error(invokeError.message);
        }
        
        result = paymentResult;
        
        // Redirecionar para a URL de pagamento se estiver disponível
        if (result && result.checkoutUrl) {
          console.log('Redirecionando para URL de pagamento:', result.checkoutUrl);
          // Usar window.open para abrir em uma nova aba ou window.location.href para redirecionar na mesma página
          window.location.href = result.checkoutUrl;
          return; // Interrompe o fluxo de execução pois estamos saindo da página
        }
      } else {
        // Para PIX, continuar usando o fluxo original
        const data = {
          ...commonData,
          paymentMethod: method
        };
        
        console.log('Enviando dados para a Edge Function (PIX):', data);
        
        const { data: pixResult, error: invokeError } = await supabase.functions.invoke('asaas-api', {
          body: { action: 'initiateCheckout', data }
        });
        
        if (invokeError) {
          console.error('Erro na Edge Function (PIX):', invokeError);
          throw new Error(invokeError.message);
        }
        
        result = pixResult;
      }
      
      console.log('Resposta da Edge Function:', result);
      
      if (!result || !result.success) {
        console.error('Erro no resultado:', result);
        throw new Error((result?.error || 'Erro desconhecido') + ' - Verifique os logs para mais detalhes');
      }
      
      setResult(result);
      setStep('result');
    } catch (e: any) {
      console.error('Checkout error', e);
      setError(e.message || 'Erro ao processar pagamento');
      setStep('result');
    } finally {
      // Processo finalizado
    }
  };
  
  // Método para verificar status do pagamento (implementação futura)
  const checkPaymentStatus = () => {
    console.log('Verificando status do pagamento...');
  };

  const handleRegeneratePix = async () => {
    if (!plan) return;
    setRegenerating(true);
    try {
      await handleInitiate('PIX');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = (text: string, type: string = 'código') => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopyFeedback(`${type} copiado!`);
        setTimeout(() => setCopyFeedback(null), 2000);
      })
      .catch(console.error);
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assinar Plano: {plan.name}</DialogTitle>
          <DialogDescription>Complete o pagamento para ativar seu plano</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {step === 'select' && (
            <>
              <p className="text-sm text-muted-foreground">Selecione o método de pagamento</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1" onClick={() => handleInitiate('PIX')}>Pix</Button>
                <Button className="flex-1" onClick={() => handleInitiate('CREDIT_CARD')}>Cartão</Button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="mt-2">
                {regenerating ? "Regenerando código PIX..." : "Gerando pedido de pagamento..."}
              </span>
            </div>
          )}

          {step === 'result' && result && paymentMethod === 'PIX' && (
            <div className="space-y-4 text-center">
              {isExpired ? (
                <div className="flex flex-col items-center mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                  <p className="text-amber-600 font-medium mt-2">Código PIX expirado!</p>
                  <Button 
                    className="mt-2 flex items-center gap-2" 
                    onClick={handleRegeneratePix}
                    disabled={regenerating}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Gerar novo código PIX
                  </Button>
                </div>
              ) : (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                  <div className="flex flex-col items-center">
                    <p className="font-medium">Use o QR Code ou copie o código Pix:</p>
                    
                    {/* Contador regressivo */}
                    {timeLeft !== null && (
                      <div className="bg-amber-50 border border-amber-200 rounded-full px-4 py-1 text-amber-700 font-medium mt-2 text-sm flex items-center">
                        <span>Expira em: {formatTimeLeft()}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Feedback de cópia */}
              {copyFeedback && (
                <div className="fixed top-4 right-4 bg-green-100 text-green-800 px-3 py-1 rounded shadow-md animate-in slide-in-from-top-5 fade-in duration-300">
                  {copyFeedback}
                </div>
              )}
              
              {!isExpired && (
                <>
                  {/* Exibir o QR Code real do PIX */}
                  {result.pixQrCode ? (
                    <div className="flex justify-center mt-4">
                      <img
                        src={`data:image/png;base64,${result.pixQrCode}`}
                        alt="QR Code Pix"
                        className="w-48 h-48 sm:w-56 sm:h-56"
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center mt-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.paymentLink)}`}
                        alt="QR Code Pix"
                        className="w-48 h-48 sm:w-56 sm:h-56"
                      />
                    </div>
                  )}
                  
                  {/* Código PIX para copia e cola */}
                  {result.pixCopyPaste && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Código Pix copia e cola:</p>
                      <div className="flex items-center gap-2 bg-muted p-2 rounded">
                        <input
                          readOnly
                          value={result.pixCopyPaste}
                          className="flex-1 rounded border px-2 py-1 text-xs bg-white overflow-hidden text-ellipsis"
                        />
                        <Button 
                          size="icon" 
                          onClick={() => handleCopy(result.pixCopyPaste, "Código PIX")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Informações de validade */}
                  <div className="mt-4 text-sm bg-slate-50 p-3 rounded-md border border-slate-100">
                    <p className="font-medium text-slate-800">Informações do pagamento:</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <p className="text-slate-600">Valor:</p>
                      <p className="text-right font-medium text-slate-800">{formatCurrency(result.value)}</p>
                      
                      <p className="text-slate-600">Expira em:</p>
                      <p className="text-right font-medium text-slate-800">{formatTimeLeft()}</p>
                    </div>
                  </div>
                  
                  {/* Link de pagamento */}
                  <div className="mt-4">
                    <Button 
                      className="w-full" 
                      onClick={() => window.open(result.paymentLink, '_blank')}
                      variant="secondary"
                    >
                      Abrir link de pagamento
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'result' && result && paymentMethod === 'CREDIT_CARD' && (
            <div className="flex flex-col space-y-4">
              <DialogDescription>Preencha seus dados de cartão abaixo:</DialogDescription>
              {result.checkoutUrl ? (
                <>
                  <iframe
                    src={result.checkoutUrl}
                    title="Checkout Cartão"
                    className="w-full h-[420px] sm:h-[450px] border"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation"
                  />
                  <div className="text-xs text-slate-500 mt-2">
                    Se o formulário não carregar, 
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-xs"
                      onClick={() => window.open(result.checkoutUrl, '_blank')}
                    >
                      clique aqui para abrir em uma nova janela
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 p-4 rounded-md border border-amber-200 text-amber-700">
                  <p className="font-medium">Não foi possível carregar o checkout</p>
                  <p className="text-sm mt-1">Tente novamente ou entre em contato com o suporte.</p>
                  <Button 
                    className="mt-3 w-full" 
                    variant="outline" 
                    onClick={() => setStep('select')}
                  >
                    Tentar novamente
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 'result' && error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
              <p className="font-medium">Erro ao processar pagamento:</p>
              <p>{error}</p>
              <Button 
                className="mt-3 w-full" 
                variant="outline" 
                onClick={() => setStep('select')}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          <div className="pt-4">
            <Button variant="outline" className="w-full" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
