<<<<<<< HEAD

import { useState } from "react";
=======
>>>>>>> main
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QrReader } from "react-qr-reader";

interface QRCodeScannerProps {
  onScan: (result: string, method: 'qr_code' | 'token') => void;
}

export function QRCodeScanner({ onScan }: QRCodeScannerProps) {
  const { toast } = useToast();
  const [manualCode, setManualCode] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleScan = (result: any, error: any) => {
    if (error) {
      console.error("QR Scanner error:", error);
      return;
    }

    if (result?.text) {
      try {
        // Add debug logs
        console.log("Raw QR Code scan result:", result.text);
        
        // Remove any whitespace and validate
        const cleanCode = result.text.trim();
        console.log("Cleaned QR code:", cleanCode);
        
        if (!cleanCode) {
          throw new Error("Código QR vazio");
        }

        // Tocar um som de sucesso quando o QR code for reconhecido
        const audio = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Bt8Qg==");
        audio.play().catch(e => console.log("Audio play failed:", e));

        onScan(cleanCode, 'qr_code');
      } catch (e) {
        console.error("Error processing QR code:", e);
        toast({
          variant: "destructive",
          title: "Erro ao ler QR Code",
          description: "Formato inválido, tente novamente ou insira o código manualmente",
        });
      }
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      toast({
        variant: "destructive",
        title: "Código inválido",
        description: "Por favor, insira um código válido",
      });
      return;
    }
    onScan(manualCode.trim(), 'token');
  };

  if (hasError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-center text-destructive">
          Não foi possível acessar a câmera. Por favor, insira o código manualmente.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Digite o código manualmente"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <Button onClick={handleManualSubmit}>
            Validar
          </Button>
        </div>
      </div>
    );
  }

  const handleScan = (result: string | null) => {
    if (result) {
      onScan(result);
    }
  };

  const handleError = (error: any) => {
    console.error("Erro no scanner:", error);
    toast({
      variant: "destructive",
      title: "Erro no scanner",
      description: "Não foi possível acessar a câmera",
    });
  };

  return (
<<<<<<< HEAD
    <div className="space-y-4">
      <div className="space-y-2 relative">
        <QrReader
          onResult={handleScan}
          constraints={{
            facingMode: "environment"
          }}
          videoId="qr-video"
          scanDelay={200}
          className="w-full aspect-square"
          ViewFinder={() => (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none">
              <div className="w-full h-full border-2 border-primary rounded-lg" />
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br" />
            </div>
          )}
        />
        <p className="text-sm text-center text-muted-foreground">
          Aponte a câmera para o QR Code da academia
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-center font-medium">ou</p>
        <div className="flex gap-2">
          <Input
            placeholder="Digite o código manualmente"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <Button onClick={handleManualSubmit}>
            Validar
          </Button>
        </div>
      </div>
=======
    <div className="py-2">
      <Scanner
        onResult={handleScan}
        onError={handleError}
        className="w-full aspect-square"
      />
      <p className="text-sm text-center text-muted-foreground mt-2">
        Aponte a câmera para o QR Code da academia
      </p>
>>>>>>> main
    </div>
  );
}
