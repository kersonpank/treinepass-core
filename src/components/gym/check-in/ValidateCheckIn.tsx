
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, QrCode, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";

export function ValidateCheckIn() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    userName?: string;
  } | null>(null);
  const { toast } = useToast();

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Generate random code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const { error } = await supabase
        .from("gym_qr_codes")
        .insert({
          code,
          academia_id: "ACADEMIA_ID", // Você precisa obter o ID da academia do contexto ou props
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

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

  return (
    <div className="space-y-4">
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
