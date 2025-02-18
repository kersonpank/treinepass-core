
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckInCode } from "@/types/check-in";

interface CheckInButtonProps {
  academiaId: string;
  userId: string;
  onSuccess: (newCode: CheckInCode) => void;
}

export function CheckInButton({ academiaId, userId, onSuccess }: CheckInButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
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

      if (qrError) throw qrError;

      const { data: checkIn, error: checkInError } = await supabase
        .from("gym_check_ins")
        .insert({
          user_id: userId,
          academia_id: academiaId,
          qr_code_id: qrCode.id,
          validation_method: "qr_code",
          status: "active",
        })
        .select()
        .single();

      if (checkInError) throw checkInError;

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
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer check-in",
        description: error.message || "Ocorreu um erro ao realizar o check-in.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckIn} disabled={isLoading}>
      {isLoading ? "Realizando Check-in..." : "Fazer Check-in"}
    </Button>
  );
}
