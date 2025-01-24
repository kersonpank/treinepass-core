import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export function ValidateCheckIn() {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateCheckIn = async () => {
    if (!code) {
      toast({
        variant: "destructive",
        title: "Código inválido",
        description: "Por favor, insira um código de check-in.",
      });
      return;
    }

    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_check_in_code', {
        p_code: code,
        p_academia_id: "ACADEMIA_ID" // Você precisa obter o ID da academia do contexto ou props
      });

      if (error) throw error;

      if (data[0].is_valid) {
        // Registrar o check-in usando o ID do usuário retornado
        const { data: checkInResult, error: checkInError } = await supabase.rpc(
          'register_check_in',
          {
            p_check_in_code_id: data[0].id,
            p_validation_method: 'manual_code'
          }
        );

        if (checkInError) throw checkInError;

        toast({
          title: "Check-in confirmado",
          description: `Check-in confirmado para ${data[0].user_name}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Código inválido",
          description: data[0].message,
        });
      }
    } catch (error) {
      console.error("Erro ao validar check-in:", error);
      toast({
        variant: "destructive",
        title: "Erro ao validar check-in",
        description: "Não foi possível validar o check-in. Tente novamente.",
      });
    } finally {
      setIsValidating(false);
      setCode("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validar Check-in</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Digite o código de check-in"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="flex-1"
          />
          <Button 
            onClick={validateCheckIn} 
            disabled={isValidating || !code}
          >
            Validar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}