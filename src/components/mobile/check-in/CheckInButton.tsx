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

      // Registrar histórico financeiro
      await supabase
        .from("gym_check_in_financial_records")
        .insert({
          check_in_id: checkInData.id,
          plan_id: validation.plano_id,
          valor_repasse: validation.valor_repasse,
          valor_plano: validation.valor_plano,
          status_pagamento: "processed",
          data_processamento: new Date().toISOString()
        });

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
