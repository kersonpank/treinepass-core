
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  academiaId: string;
}

export function QRCodeGenerator({ academiaId }: QRCodeGeneratorProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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
  );
}
