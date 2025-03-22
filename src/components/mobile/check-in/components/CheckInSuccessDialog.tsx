import { CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface CheckInSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckInSuccessDialog({
  open,
  onOpenChange,
}: CheckInSuccessDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md text-center">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            Check-in Realizado!
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            Seu check-in foi registrado com sucesso.
          </p>
          <p className="text-muted-foreground">
            Boas atividades!
          </p>
        </div>
        <AlertDialogFooter className="flex justify-center">
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
