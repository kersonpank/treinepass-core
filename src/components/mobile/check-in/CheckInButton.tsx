import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CheckInButtonProps {
  academiaId: string;
  userId: string;
  onSuccess: (checkInCode: any) => void;
  disabled?: boolean;
}

export function CheckInButton({ academiaId, userId, onSuccess, disabled }: CheckInButtonProps) {
  const { toast } = useToast();

  const generateCheckInCode = async () => {
    try {
      // Verify if academia exists
      const { data: academia, error: academiaError } = await supabase
        .from("academias")
        .select("id, nome")
        .eq("id", academiaId)
        .single();

      if (academiaError || !academia) {
        toast({
          variant: "destructive",
          title: "Erro ao gerar check-in",
          description: "Academia não encontrada ou indisponível.",
        });
        return;
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      const generatedAt = new Date().toISOString();

      const qrData = {
        user_id: userId,
        academia_id: academiaId,
        generated_at: generatedAt,
        code,
      };

      const { data: checkInCode, error } = await supabase
        .from("check_in_codes")
        .insert({
          user_id: userId,
          academia_id: academiaId,
          code,
          qr_data: qrData,
          expires_at: expiresAt.toISOString(),
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Check-in gerado com sucesso!",
        description: `Apresente o QR Code ou informe o código: ${code}`,
      });

      onSuccess(checkInCode);
    } catch (error) {
      console.error("Error generating check-in:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar check-in",
        description: "Não foi possível gerar o check-in. Tente novamente.",
      });
    }
  };

  return (
    <Button
      onClick={generateCheckInCode}
      disabled={disabled}
      className="w-full"
    >
      Gerar Check-in
    </Button>
  );
}