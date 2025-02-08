
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QrReader } from "react-qr-reader";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
}

export function QRCodeScanner({ onScan }: QRCodeScannerProps) {
  const { toast } = useToast();
  const [manualCode, setManualCode] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleScan = (result: any) => {
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

        onScan(cleanCode);
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

  const handleError = (error: any) => {
    console.error("Scanner error:", error);
    setHasError(true);
    toast({
      variant: "destructive",
      title: "Erro no scanner",
      description: "Não foi possível acessar a câmera",
    });
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
    onScan(manualCode.trim());
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <QrReader
          onResult={handleScan}
          onError={handleError}
          constraints={{
            facingMode: "environment"
          }}
          className="w-full aspect-square"
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
    </div>
  );
}
