import React, { useState } from "react";
import { PaymentMethodDialog } from "./PaymentMethodDialog";
import { BusinessPlanCheckoutDialog } from "./checkout/BusinessPlanCheckoutDialog";
import { useAsaasCheckout } from "@/hooks/useAsaasCheckout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Função utilitária para buscar endereço via ViaCEP
async function fetchAddressByCep(cep: string) {
  const sanitizedCep = cep.replace(/\D/g, "");
  if (sanitizedCep.length !== 8) return null;
  const resp = await fetch(`https://viacep.com.br/ws/${sanitizedCep}/json/`);
  const data = await resp.json();
  if (data.erro) return null;
  return data;
}

export function PlanPaymentFlow({ planId, planName, planValue, onSuccess }: { planId: string, planName: string, planValue: number, onSuccess: () => void }) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [creditCardData, setCreditCardData] = useState<any>({});
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const { createCheckoutSession, isLoading } = useAsaasCheckout();

  // Handler para seleção de método
  function handleSelectMethod(method: string) {
    setSelectedMethod(method);
    if (method !== "CREDIT_CARD") {
      handleGoToCheckout(method);
    }
  }

  // Busca automática de endereço por CEP
  async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
    const cep = e.target.value;
    setAddressLoading(true);
    setAddressError("");
    const address = await fetchAddressByCep(cep);
    setAddressLoading(false);
    if (!address) {
      setAddressError("CEP não encontrado ou inválido.");
      return;
    }
    setCreditCardData((prev: any) => ({
      ...prev,
      address: address.logradouro,
      addressNumber: prev.addressNumber || "",
      neighborhood: address.bairro,
      city: address.localidade,
      province: address.uf,
      postalCode: cep,
    }));
  }

  // Inicia o fluxo de checkout com os dados corretos
  async function handleGoToCheckout(method: string) {
    let billingTypes = [method];
    let customerData = undefined;
    if (method === "CREDIT_CARD") {
      // Validação simples
      if (!creditCardData.name || !creditCardData.cpfCnpj || !creditCardData.email || !creditCardData.phone || !creditCardData.address || !creditCardData.addressNumber || !creditCardData.postalCode) {
        alert("Preencha todos os dados do cartão e endereço.");
        return;
      }
      customerData = creditCardData;
    }
    // Monta os itens do plano
    const items = [{
      name: planName,
      description: planName,
      quantity: 1,
      value: planValue
    }];
    const result = await createCheckoutSession({
      value: planValue,
      description: planName,
      externalReference: planId,
      customerData,
      billingTypes,
      items,
      successUrl: window.location.origin + "/assinatura/sucesso",
      failureUrl: window.location.origin + "/assinatura/erro"
    });
    if (result.success) {
      setCheckoutData({
        invoiceUrl: result.checkoutUrl,
        value: planValue,
        billingType: method,
        status: "PENDING",
        dueDate: "",
        paymentId: result.checkoutData?.id || ""
      });
      setShowCheckout(true);
      setShowPaymentDialog(false);
    }
  }

  // UX: mensagem de segurança
  function PaymentSecurityNotice() {
    return (
      <div className="text-xs text-center text-muted-foreground my-2">
        Para sua segurança, o pagamento será validado diretamente pelo Asaas. Você será redirecionado para finalizar a contratação.
      </div>
    );
  }

  return (
    <>
      <Button className="w-full" size="lg" onClick={() => setShowPaymentDialog(true)}>
        Contratar Plano
      </Button>
      <PaymentMethodDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onSelect={handleSelectMethod}
        planId={planId}
        loading={isLoading}
      />
      {/* Se cartão de crédito, exibe formulário */}
      {selectedMethod === "CREDIT_CARD" && showPaymentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm mx-auto">
            <h2 className="text-lg font-bold mb-2 text-center">Dados do Cartão</h2>
            <form className="space-y-2">
              <Input placeholder="Nome completo" value={creditCardData.name || ""} onChange={e => setCreditCardData((prev: any) => ({ ...prev, name: e.target.value }))} />
              <Input placeholder="CPF ou CNPJ" value={creditCardData.cpfCnpj || ""} onChange={e => setCreditCardData((prev: any) => ({ ...prev, cpfCnpj: e.target.value }))} />
              <Input placeholder="E-mail" value={creditCardData.email || ""} onChange={e => setCreditCardData((prev: any) => ({ ...prev, email: e.target.value }))} />
              <Input placeholder="Telefone" value={creditCardData.phone || ""} onChange={e => setCreditCardData((prev: any) => ({ ...prev, phone: e.target.value }))} />
              <Input placeholder="CEP" value={creditCardData.postalCode || ""} onChange={e => setCreditCardData((prev: any) => ({ ...prev, postalCode: e.target.value }))} onBlur={handleCepBlur} />
              {addressLoading && <div className="text-xs text-blue-600">Buscando endereço...</div>}
              {addressError && <div className="text-xs text-red-600">{addressError}</div>}
              <Input placeholder="Endereço" value={creditCardData.address || ""} onChange={e => setCreditCardData((prev: any) => ({ ...prev, address: e.target.value }))} />
              <Input placeholder="Número" value={creditCardData.addressNumber || ""} onChange={e => setCreditCardData((prev: any) => ({ ...prev, addressNumber: e.target.value }))} />
              <Input placeholder="Bairro" value={creditCardData.neighborhood || ""} onChange={e => setCreditCardData((prev: any) => ({ ...prev, neighborhood: e.target.value }))} />
              <Input placeholder="Cidade" value={creditCardData.city || ""} onChange={e => setCreditCardData((prev: any) => ({ ...prev, city: e.target.value }))} />
              <Input placeholder="Estado" value={creditCardData.province || ""} onChange={e => setCreditCardData((prev: any) => ({ ...prev, province: e.target.value }))} />
              <Button className="w-full mt-2" type="button" onClick={() => handleGoToCheckout("CREDIT_CARD")}>Pagar com Cartão</Button>
            </form>
            <Button className="w-full mt-2" variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancelar</Button>
            <PaymentSecurityNotice />
          </div>
        </div>
      )}
      <BusinessPlanCheckoutDialog
        showCheckout={showCheckout}
        handleCloseCheckout={() => setShowCheckout(false)}
        checkoutData={checkoutData}
        isVerifyingPayment={isVerifyingPayment}
        copiedText={copiedText}
        handleCopyToClipboard={setCopiedText}
      />
    </>
  );
}
