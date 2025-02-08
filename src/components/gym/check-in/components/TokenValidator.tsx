
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
      // Primeiro, valida o código
      const { data: validationData, error: validationError } = await supabase.rpc('validate_check_in_code', {
        p_code: accessToken,
        p_academia_id: academiaId
      });

      if (validationError) throw validationError;

      const checkInResult = validationData[0];

      // Se o código é válido, procede com o check-in
      if (checkInResult.is_valid) {
        const { data: checkInData, error: checkInError } = await supabase.rpc('validate_gym_check_in', {
          p_user_id: checkInResult.user_id,
          p_academia_id: academiaId,
          p_qr_code: accessToken,
          p_validation_method: 'token'
        });

        if (checkInError) throw checkInError;

        if (checkInData[0].success) {
          setValidationResult({
            success: true,
            message: "Check-in realizado com sucesso",
            userName: checkInResult.user_name
          });

          toast({
            title: "Check-in válido",
            description: `Check-in confirmado para ${checkInResult.user_name || 'usuário'}`,
          });
        } else {
          setValidationResult({
            success: false,
            message: checkInData[0].message
          });

          toast({
            variant: "destructive",
            title: "Check-in inválido",
            description: checkInData[0].message,
          });
        }
      } else {
        setValidationResult({
          success: false,
          message: checkInResult.message
        });

        toast({
          variant: "destructive",
          title: "Token inválido",
          description: checkInResult.message,
        });
      }
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
