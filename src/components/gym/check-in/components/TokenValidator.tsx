
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";

interface TokenValidatorProps {
  academiaId: string;
}

interface ValidationResult {
  success: boolean;
  message: string;
  userName?: string;
}

export function TokenValidator({ academiaId }: TokenValidatorProps) {
  const [accessToken, setAccessToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const validateAccessToken = async () => {
    if (!academiaId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID da academia não encontrado",
      });
      return;
    }

    if (!accessToken.trim()) {
      toast({
        variant: "destructive",
        title: "Token inválido",
        description: "Por favor, insira um token de acesso.",
      });
      return;
    }

    setIsValidating(true);
    try {
      console.log("Validando token:", {
        token: accessToken,
        academiaId: academiaId
      });

      // Primeiro vamos buscar o check-in ativo com este token
      const { data: checkIn, error: checkInError } = await supabase
        .from('gym_check_ins')
        .select(`
          id,
          user_id,
          user_profiles!inner (
            full_name
          )
        `)
        .eq('access_token', accessToken.toUpperCase())
        .eq('academia_id', academiaId)
        .eq('status', 'active')
        .eq('validation_method', 'access_token')
        .gt('token_expires_at', new Date().toISOString())
        .single();

      console.log("Resultado da busca:", { checkIn, checkInError });

      if (checkInError || !checkIn) {
        setValidationResult({
          success: false,
          message: "Token inválido ou expirado"
        });
        return;
      }

      // Atualizar o status do check-in para usado
      const { error: updateError } = await supabase
        .from('gym_check_ins')
        .update({
          status: 'used',
          check_in_time: new Date().toISOString()
        })
        .eq('id', checkIn.id);

      if (updateError) throw updateError;

      const userName = checkIn.user_profiles?.full_name || 'usuário';
      setValidationResult({
        success: true,
        message: "Check-in validado com sucesso",
        userName: userName
      });

      toast({
        title: "Check-in válido",
        description: `Check-in confirmado para ${userName}`,
      });

    } catch (error: any) {
      console.error("Erro ao validar token:", error);
      toast({
        variant: "destructive",
        title: "Erro na validação",
        description: "Não foi possível validar o token. Tente novamente.",
      });
      setValidationResult({
        success: false,
        message: "Erro ao validar token"
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o token de acesso"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <Button 
                onClick={validateAccessToken}
                disabled={isValidating}
              >
                Validar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Insira o token de acesso fornecido pelo usuário
            </p>
          </div>
        </CardContent>
      </Card>

      {validationResult && (
        <Alert variant={validationResult.success ? "default" : "destructive"}>
          {validationResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {validationResult.success ? "Check-in confirmado" : "Check-in inválido"}
          </AlertTitle>
          <AlertDescription>
            {validationResult.success && validationResult.userName
              ? `${validationResult.message} - ${validationResult.userName}`
              : validationResult.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
