
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
      
      // Criar código de check-in para carteirinha digital
      const { data: checkInCode, error: codeError } = await supabase
        .from("check_in_codes")
        .insert({
          user_id: user.id,
          code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          status: "active",
          expires_at: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutos
          academia_id: academiaId
        })
        .select()
        .single();

      if (codeError) {
        console.error("Erro ao gerar código de check-in:", codeError);
        throw new Error("Não foi possível gerar o código de check-in");
      }

      if (checkInCode) {
        onSuccess(checkInCode as CheckInCode);
      }

      toast({
        title: "Código gerado!",
        description: "Use o código para fazer check-in na academia.",
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
