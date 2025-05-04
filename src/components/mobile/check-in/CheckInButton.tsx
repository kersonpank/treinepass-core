
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckInCode } from "@/types/check-in";

interface CheckInButtonProps {
  academiaId: string;
  automatic?: boolean;
  onManualCheckIn?: () => void;
  onSuccess: (newCode: CheckInCode) => void;
}

export function CheckInButton({ 
  academiaId, 
  automatic = true, 
  onManualCheckIn, 
  onSuccess 
}: CheckInButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckIn = async () => {
    if (!automatic && onManualCheckIn) {
      onManualCheckIn();
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Você precisa estar logado para fazer check-in");
      }

      // Verificar se o usuário pode fazer check-in
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_check_in_rules', {
          p_user_id: user.id,
          p_academia_id: academiaId
        });

      const validation = validationResult?.[0];
      
      if (validationError || !validation?.can_check_in) {
        throw new Error(validation?.message || "Não foi possível validar o check-in");
      }

      // Registrar check-in com informações financeiras
      const { data: checkInData, error: checkInError } = await supabase
        .from("gym_check_ins")
        .insert({
          user_id: user.id,
          academia_id: academiaId,
          check_in_time: new Date().toISOString(),
          status: "active",
          validation_method: "automatic",
          valor_repasse: validation.valor_repasse,
          plano_id: validation.plano_id
        })
        .select()
        .single();

      if (checkInError) throw checkInError;

      // Criar código de check-in para carteirinha digital
      const { data: checkInCode, error: codeError } = await supabase
        .from("check_in_codes")
        .insert({
          user_id: user.id,
          code: Math.random().toString(36).substring(2, 10).toUpperCase(),
          status: "active",
          expires_at: new Date(Date.now() + 30 * 60000).toISOString() // 30 minutos
        })
        .select()
        .single();

      if (codeError) {
        console.error("Erro ao gerar código de check-in:", codeError);
        // Continuamos mesmo com erro no código
      } else if (checkInCode) {
        onSuccess(checkInCode as CheckInCode);
      }

      toast({
        title: "Check-in realizado!",
        description: "Check-in realizado com sucesso. Boas atividades!",
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao realizar check-in",
        description: error.message,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
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
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end">
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirm(false);
                handleCheckIn();
              }}
              disabled={isLoading}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
