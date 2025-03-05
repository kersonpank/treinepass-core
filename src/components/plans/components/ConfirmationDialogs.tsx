
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface UpgradeDialogProps {
  show: boolean;
  onClose: () => void;
  selectedPlan: any;
  proratedAmount: number;
  isSubscribing: boolean;
  onConfirm: () => void;
}

export function UpgradeDialog({
  show,
  onClose,
  selectedPlan,
  proratedAmount,
  isSubscribing,
  onConfirm,
}: UpgradeDialogProps) {
  return (
    <AlertDialog open={show} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Upgrade de Plano</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Você está mudando para o plano {selectedPlan?.name}.
            </p>
            <p className="font-medium">
              Valor proporcional a ser pago: {formatCurrency(proratedAmount)}
            </p>
            <p className="text-sm text-muted-foreground">
              O valor é calculado considerando os dias restantes do mês atual.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={isSubscribing}>
            {isSubscribing ? "Processando..." : "Confirmar Upgrade"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface CancelDialogProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelDialog({ show, onClose, onConfirm }: CancelDialogProps) {
  return (
    <AlertDialog open={show} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
          <AlertDialogDescription>
            Seu plano será cancelado no próximo ciclo de cobrança.
            Até lá, você continuará tendo acesso a todos os benefícios.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Manter Plano</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm}>
            Confirmar Cancelamento
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
