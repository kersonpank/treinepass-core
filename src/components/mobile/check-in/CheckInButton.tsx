import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
<<<<<<< HEAD
import { useToast } from "@/hooks/use-toast";
import { CheckInCode } from "@/types/check-in";
=======
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
>>>>>>> main

interface CheckInButtonProps {
  academiaId: string;
  userId: string;
  onSuccess: (newCode: CheckInCode) => void;
}

<<<<<<< HEAD
export function CheckInButton({ academiaId, userId, onSuccess }: CheckInButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
=======
// Interface para o resultado da validação de check-in
interface CheckInValidationResult {
  can_check_in: boolean;
  message: string;
  valor_repasse?: number;
  plano_id?: string;
  valor_plano?: number;
  p_num_checkins?: number;
  remaining_daily?: number;
  remaining_weekly?: number;
  remaining_monthly?: number;
}

export function CheckInButton({ academiaId, automatic, onManualCheckIn }: CheckInButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNoPlanDialog, setShowNoPlanDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
>>>>>>> main

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
<<<<<<< HEAD
      const { data: qrCode, error: qrError } = await supabase
        .from("gym_qr_codes")
        .insert({
          academia_id: academiaId,
          status: "active",
          code: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos
        })
        .select()
        .single();
=======
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Você precisa estar logado para fazer check-in");
      }
>>>>>>> main

      if (qrError) throw qrError;

<<<<<<< HEAD
      const { data: checkIn, error: checkInError } = await supabase
=======
      const validation = validationResult?.[0] as CheckInValidationResult | undefined;
      
      // Se não puder fazer check-in porque não tem plano ativo, mostrar diálogo
      if (validationError || !validation?.can_check_in) {
        const errorMessage = validation?.message || "Não foi possível validar o check-in";
        
        // Se a mensagem indicar que o usuário não tem plano ativo
        if (errorMessage.includes("não possui um plano ativo")) {
          setShowNoPlanDialog(true);
          return;
        }
        
        throw new Error(errorMessage);
      }

      // Registrar check-in com informações financeiras
      const { data: checkInData, error: checkInError } = await supabase
>>>>>>> main
        .from("gym_check_ins")
        .insert({
          user_id: userId,
          academia_id: academiaId,
          qr_code_id: qrCode.id,
          validation_method: "qr_code",
          status: "active",
<<<<<<< HEAD
=======
          validation_method: "automatic",
          valor_repasse: validation.valor_repasse || 0,
          plano_id: validation.plano_id
>>>>>>> main
        })
        .select()
        .single();

      if (checkInError) throw checkInError;

<<<<<<< HEAD
      onSuccess({
        id: checkIn.id,
        code: qrCode.code,
        status: "active",
        expires_at: qrCode.expires_at,
        created_at: checkIn.created_at,
        user_id: userId,
        academia_id: academiaId
      });

      toast({
        title: "Check-in realizado!",
        description: "Você fez check-in com sucesso.",
=======
      // Comentamos o registro financeiro até corrigir a definição da tabela no tipo do Supabase
      // try {
      //   await supabase
      //     .from("gym_check_in_financial_records")
      //     .insert({
      //       check_in_id: checkInData.id,
      //       plan_id: validation.plano_id,
      //       valor_repasse: validation.valor_repasse || 0,
      //       valor_plano: validation.valor_plano || 0,
      //       status_pagamento: "processed",
      //       data_processamento: new Date().toISOString()
      //     });
      // } catch (financialError) {
      //   console.error("Erro ao registrar histórico financeiro:", financialError);
      // }

      toast({
        title: "Check-in realizado!",
        description: "Check-in realizado com sucesso. Boas atividades!",
        duration: 5000,
>>>>>>> main
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
<<<<<<< HEAD
        title: "Erro ao fazer check-in",
        description: error.message || "Ocorreu um erro ao realizar o check-in.",
=======
        title: "Erro ao realizar check-in",
        description: error.message,
        duration: 5000,
>>>>>>> main
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <Button onClick={handleCheckIn} disabled={isLoading}>
      {isLoading ? "Realizando Check-in..." : "Fazer Check-in"}
    </Button>
=======
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

      {/* Diálogo para usuários sem plano ativo */}
      <AlertDialog open={showNoPlanDialog} onOpenChange={setShowNoPlanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Plano Necessário</AlertDialogTitle>
            <AlertDialogDescription>
              Você precisa ter um plano ativo para realizar check-in. 
              Que tal conhecer nossos planos disponíveis?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNoPlanDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowNoPlanDialog(false);
                navigate('/app/plans');
              }}
            >
              Ver Planos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
>>>>>>> main
  );
}
