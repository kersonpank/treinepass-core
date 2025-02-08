
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
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Você precisa estar logado para fazer check-in",
        });
        return;
      }

      // Verificar se o usuário pode fazer check-in
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_check_in_rules', {
          p_user_id: user.id,
          p_academia_id: academiaId
        });

      const validation = validationResult?.[0];
      
      if (validationError || !validation?.can_check_in) {
        toast({
          variant: "destructive",
          title: "Check-in não permitido",
          description: validation?.message || "Não foi possível validar o check-in",
        });
        return;
      }

      // Calcular o valor de repasse baseado no número de check-ins do mês
      const { data: monthlyCheckins } = await supabase
        .from('gym_check_ins')
        .select('id')
        .eq('academia_id', academiaId)
        .gte('check_in_time', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .lte('check_in_time', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString());

      const { data: repasseData } = await supabase
        .rpc('get_valor_repasse_academia', {
          p_academia_id: academiaId,
          p_num_checkins: (monthlyCheckins?.length || 0)
        });

      const valorRepasse = repasseData?.[0]?.valor_repasse || 0;

      // Registrar check-in
      const { error: checkInError } = await supabase
        .from("gym_check_ins")
        .insert({
          user_id: user.id,
          academia_id: academiaId,
          check_in_time: new Date().toISOString(),
          status: "active",
          validation_method: "automatic",
          valor_repasse: valorRepasse
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
