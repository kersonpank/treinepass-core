
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Landmark, Qrcode } from "lucide-react";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (method: string) => void;
  planId: string;
  loading?: boolean;
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  onSelect,
  planId,
  loading = false
}: PaymentMethodDialogProps) {
  const handleSelect = (method: string) => {
    onSelect(method);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escolha a forma de pagamento</DialogTitle>
          <DialogDescription>
            Selecione como você deseja realizar o pagamento do seu plano
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="flex justify-start items-center gap-3 p-6"
            onClick={() => handleSelect("pix")}
            disabled={loading}
          >
            <div className="bg-emerald-100 p-2 rounded-full">
              <Qrcode className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">PIX</div>
              <div className="text-sm text-muted-foreground">Pagamento instantâneo</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex justify-start items-center gap-3 p-6"
            onClick={() => handleSelect("boleto")}
            disabled={loading}
          >
            <div className="bg-blue-100 p-2 rounded-full">
              <Landmark className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Boleto Bancário</div>
              <div className="text-sm text-muted-foreground">
                Vencimento em 3 dias
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex justify-start items-center gap-3 p-6"
            onClick={() => handleSelect("credit_card")}
            disabled={loading}
          >
            <div className="bg-purple-100 p-2 rounded-full">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Cartão de Crédito</div>
              <div className="text-sm text-muted-foreground">
                Pagamento rápido e seguro
              </div>
            </div>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Pagamentos processados com segurança pelo Asaas
        </div>
      </DialogContent>
    </Dialog>
  );
}
