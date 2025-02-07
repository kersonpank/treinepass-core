
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
import { CheckInValidation } from "@/types/gym";

interface CheckInButtonProps {
  academiaId: string;
  automatic: boolean;
  onManualCheckIn: () => void;
}

export function CheckInButton({ academiaId, automatic, onManualCheckIn }: CheckInButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckIn = async () => {
    if (!automatic) {
      onManualCheckIn();
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para fazer check-in",
        });
        return;
      }

      // Verificar se o usuário pode fazer check-in
      const { data: validationResult, error: validationError } = await supabase
        .rpc('can_user_check_in', {
          p_user_id: user.id,
          p_academia_id: academiaId
        });

      const validation = validationResult?.[0] as CheckInValidation;
      
      if (validationError || !validation.can_check_in) {
        toast({
          variant: "destructive",
          title: "Check-in não permitido",
          description: validation?.message || "Não foi possível validar o check-in",
        });
        return;
      }

      // Registrar check-in
      const { error: checkInError } = await supabase
        .from("check_ins")
        .insert({
          user_id: user.id,
          academia_id: academiaId,
          check_in_time: new Date().toISOString(),
          status: "active",
        });

      if (checkInError) throw checkInError;

      toast({
        title: "Check-in realizado!",
        description: "Check-in realizado com sucesso. Boas atividades!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao realizar check-in",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Button
        className="w-full"
        size="lg"
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
      >
        Fazer Check-in
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Check-in</AlertDialogTitle>
            <AlertDialogDescription>
              Você confirma o check-in nesta academia?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckIn} disabled={isLoading}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
