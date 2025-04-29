
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DeletePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  planName: string;
  isLoading?: boolean;
}

export function DeletePlanDialog({
  open,
  onOpenChange,
  onConfirm,
  planName,
  isLoading = false,
}: DeletePlanDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmDisabled = confirmText !== planName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir plano
          </DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. O plano será permanentemente excluído do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Digite <span className="font-bold">{planName}</span> para confirmar a exclusão:
            </p>
            <input
              type="text"
              className="mt-2 w-full rounded-md border px-3 py-2"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={planName}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isConfirmDisabled || isLoading}
          >
            {isLoading ? "Excluindo..." : "Excluir plano"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
