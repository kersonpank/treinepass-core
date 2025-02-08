
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
        code: accessToken,
        academiaId: academiaId
      });

      // Primeiro, verificar token de acesso direto no gym_check_ins
      const { data: accessTokenData, error: accessTokenError } = await supabase
        .from('gym_check_ins')
        .select(`
          id,
          user_id,
          user_profiles!inner (
            full_name
          )
        `)
        .eq('code', accessToken.toUpperCase())
        .eq('academia_id', academiaId)
        .eq('validation_method', 'access_token')
        .eq('status', 'active')
        .maybeSingle();

      console.log("Resultado da validação do token de acesso:", { accessTokenData, accessTokenError });

      if (accessTokenError) throw accessTokenError;

      if (accessTokenData) {
        const userName = accessTokenData.user_profiles?.full_name || 'usuário';
        setValidationResult({
          success: true,
          message: "Check-in validado com sucesso",
          userName: userName
        });

        toast({
          title: "Check-in válido",
          description: `Check-in confirmado para ${userName}`,
        });
        return;
      }

      // Se não encontrou como token de acesso, verificar QR code
      const { data: qrCodeData, error: qrCodeError } = await supabase
        .from('gym_qr_codes')
        .select(`
          id,
          code,
          academia_id,
          expires_at,
          status
        `)
        .eq('code', accessToken.toUpperCase())
        .eq('academia_id', academiaId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      console.log("Resultado da validação do QR Code:", { qrCodeData, qrCodeError });

      if (qrCodeError) throw qrCodeError;

      if (qrCodeData) {
        const { data: checkInData, error: checkInError } = await supabase
          .from('gym_check_ins')
          .select(`
            id,
            user_id,
            user_profiles!inner (
              full_name
            )
          `)
          .eq('qr_code_id', qrCodeData.id)
          .maybeSingle();

        if (checkInError) throw checkInError;

        if (checkInData) {
          const userName = checkInData.user_profiles?.full_name || 'usuário';
          setValidationResult({
            success: true,
            message: "Check-in validado com sucesso",
            userName: userName
          });

          toast({
            title: "Check-in válido",
            description: `Check-in confirmado para ${userName}`,
          });
          return;
        }
      }

      // Se não encontrou nenhum token válido
      setValidationResult({
        success: false,
        message: "Token inválido ou expirado"
      });

      toast({
        variant: "destructive",
        title: "Token inválido",
        description: "Token inválido ou expirado",
      });

    } catch (error: any) {
      console.error("Erro ao validar token:", error);
      toast({
        variant: "destructive",
        title: "Erro na validação",
        description: "Não foi possível validar o token. Tente novamente.",
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
