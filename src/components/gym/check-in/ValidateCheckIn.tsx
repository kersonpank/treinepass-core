
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, QrCode, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";

export function ValidateCheckIn() {
  const { id: academiaId } = useParams();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    userName?: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!academiaId) return;
    
    // Subscribe to real-time check-ins
    const channel = supabase
      .channel('public:gym_check_ins')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gym_check_ins',
          filter: `academia_id=eq.${academiaId}`
        },
        (payload) => {
          console.log("Novo check-in detectado:", payload);
          // Show a toast for new check-ins
          toast({
            title: "Novo check-in registrado",
            description: "Um novo check-in foi registrado com sucesso!",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [academiaId, toast]);

  const generateQRCode = async () => {
    if (!academiaId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID da academia não encontrado",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate random code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const { error } = await supabase
        .from("gym_qr_codes")
        .insert({
          code,
          academia_id: academiaId,
          expires_at: expiresAt.toISOString(),
          status: "active"
        });

      if (error) {
        console.error("Erro ao gerar QR code:", error);
        throw error;
      }

      setQrCode(code);
      toast({
        title: "QR Code gerado",
        description: "Novo QR Code gerado com sucesso!",
      });

      // Auto-expire after 5 minutes
      setTimeout(() => {
        setQrCode(null);
        setValidationResult(null);
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error("Erro ao gerar QR code:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar QR Code",
        description: "Não foi possível gerar o QR Code. Tente novamente.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
      console.log("Validando token:", accessToken, "para academia:", academiaId);
      
      // Buscar check-in pendente pelo token de validação
      const { data: checkInData, error: checkInError } = await supabase
        .from("gym_check_ins")
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            email
          ),
          plano:plano_id (
            id,
            name,
            plan_type
          )
        `)
        .eq("validation_token", accessToken)
        .eq("academia_id", academiaId)
        .eq("status", "pending")
        .single();

      if (checkInError) {
        console.error("Erro ao buscar check-in:", checkInError);
        throw new Error("Token inválido ou expirado");
      }

      if (!checkInData) {
        throw new Error("Check-in não encontrado");
      }

      console.log("Check-in encontrado:", checkInData);

      // Atualizar status do check-in
      const { error: updateError } = await supabase
        .from("gym_check_ins")
        .update({
          status: "active",
          validated_at: new Date().toISOString()
        })
        .eq("id", checkInData.id);

      if (updateError) {
        console.error("Erro ao atualizar check-in:", updateError);
        throw updateError;
      }

      // Atualizar registro financeiro
      const { error: financialError } = await supabase
        .from("gym_check_in_financial_records")
        .update({
          status_pagamento: "processed",
          data_processamento: new Date().toISOString()
        })
        .eq("check_in_id", checkInData.id);

      if (financialError) {
        console.error("Erro ao atualizar registro financeiro:", financialError);
        // Não falhar o processo por causa do financeiro
      }

      setValidationResult({
        success: true,
        message: "Check-in validado com sucesso",
        userName: checkInData.user?.full_name
      });

      toast({
        title: "Check-in validado!",
        description: `Check-in confirmado para ${checkInData.user?.full_name}`,
      });

    } catch (error: any) {
      console.error("Erro ao validar token:", error);
      setValidationResult({
        success: false,
        message: error.message || "Erro ao validar token",
      });
      toast({
        variant: "destructive",
        title: "Erro na validação",
        description: error.message || "Não foi possível validar o token. Tente novamente.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="qrcode" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          <TabsTrigger value="token">Token de Acesso</TabsTrigger>
        </TabsList>

        <TabsContent value="qrcode">
          <Card>
            <CardContent className="pt-6">
              {qrCode ? (
                <div className="flex flex-col items-center gap-4">
                  <QRCodeSVG
                    value={qrCode}
                    size={200}
                    level="H"
                    includeMargin
                    className="border-8 border-white rounded-lg shadow-lg"
                  />
                  <p className="text-lg font-semibold">Código: {qrCode}</p>
                  <p className="text-sm text-muted-foreground">
                    Este QR Code expira em 5 minutos
                  </p>
                  <Button
                    onClick={generateQRCode}
                    disabled={isGenerating}
                    variant="outline"
                  >
                    Gerar Novo QR Code
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button
                    onClick={generateQRCode}
                    disabled={isGenerating}
                    className="w-full md:w-auto"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar QR Code para Check-in
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="token">
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
        </TabsContent>
      </Tabs>

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
