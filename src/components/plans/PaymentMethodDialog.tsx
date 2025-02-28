import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (planId: string) => void;
  planId: string;
  loading?: boolean;
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  onSelect,
  planId,
  loading
}: PaymentMethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Escolha como deseja pagar</DialogTitle>
          <DialogDescription>
            Você será redirecionado para o checkout do Asaas onde poderá escolher entre:
            PIX, Cartão de Crédito ou Boleto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            onClick={() => onSelect(planId)}
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Ir para o checkout'}
          </Button>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 