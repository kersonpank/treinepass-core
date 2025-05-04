
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

export function ManualCheckIn() {
  const { id: academiaId } = useParams<{ id: string }>();
  const [isChecking, setIsChecking] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const handleManualCheckIn = async () => {
    if (!academiaId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID da academia não encontrado",
      });
      return;
    }

    setIsChecking(true);
    setCheckInResult(null);

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

      // Registrar check-in
      const { data: checkInData, error: checkInError } = await supabase
        .from("gym_check_ins")
        .insert({
          user_id: user.id,
          academia_id: academiaId,
          check_in_time: new Date().toISOString(),
          status: "active",
          validation_method: "manual",
          valor_repasse: validation.valor_repasse,
          plano_id: validation.plano_id
        })
        .select()
        .single();

      if (checkInError) throw checkInError;
      
      // Skip financial records since the table may not exist
      /*
      // Registrar histórico financeiro
      const { error: financialError } = await supabase
        .from("gym_check_in_financial_records")
        .insert({
          check_in_id: checkInData.id,
          plan_id: validation.plano_id,
          valor_repasse: validation.valor_repasse,
          valor_plano: validation.valor_plano,
          status_pagamento: "processed",
          data_processamento: new Date().toISOString()
        });

      if (financialError) {
        console.error("Erro ao registrar histórico financeiro:", financialError);
        // Não falhar o processo por causa do financeiro
      }
      */

      // Sucesso
      setCheckInResult({
        success: true,
        message: "Check-in realizado com sucesso!",
      });

      toast({
        title: "Check-in realizado!",
        description: "Check-in realizado com sucesso. Boas atividades!",
      });
    } catch (error: any) {
      console.error("Erro ao realizar check-in:", error);
      
      setCheckInResult({
        success: false,
        message: error.message || "Erro ao realizar check-in",
      });
      
      toast({
        variant: "destructive",
        title: "Erro ao realizar check-in",
        description: error.message,
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 flex flex-col items-center gap-4">
        {checkInResult ? (
          <>
            {checkInResult.success ? (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
            
            <Alert variant={checkInResult.success ? "default" : "destructive"}>
              <AlertTitle>
                {checkInResult.success ? "Check-in confirmado" : "Erro no check-in"}
              </AlertTitle>
              <AlertDescription>
                {checkInResult.message}
              </AlertDescription>
            </Alert>

            {checkInResult.success ? (
              <Button className="mt-4" variant="outline" disabled>
                Confirmado ✓
              </Button>
            ) : (
              <Button onClick={handleManualCheckIn} className="mt-4">
                Tentar novamente
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="text-center text-muted-foreground">
              Clique no botão abaixo para fazer check-in diretamente nesta academia.
            </p>
            
            <Button 
              onClick={handleManualCheckIn} 
              disabled={isChecking}
              size="lg"
              className="mt-4"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Fazer Check-in"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
