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
      const { data, error } = await supabase
        .from("check_in_codes")
        .insert({
          user_id: userId,
          academia_id: academiaId,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      onSuccess(data);
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
