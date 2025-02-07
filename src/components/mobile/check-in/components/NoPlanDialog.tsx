
import { ArrowRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NoPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoPlanDialog({ open, onOpenChange }: NoPlanDialogProps) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Plano Necessário
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você precisa ter um plano ativo para realizar check-in. 
            Que tal conhecer nossos planos disponíveis?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              onOpenChange(false);
              navigate('/app/plans');
            }}
            className="flex items-center gap-2"
          >
            Ver Planos
            <ArrowRight className="h-4 w-4" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
