
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
}

export function QRCodeScanner({ onScan }: QRCodeScannerProps) {
  const { toast } = useToast();
  const [manualCode, setManualCode] = useState("");
  const [hasError, setHasError] = useState(false);

  const handleScan = (result: string) => {
    try {
      console.log("QR Code scan result:", result);
      onScan(result.trim());
    } catch (e) {
      console.error("Error processing QR code:", e);
      toast({
        variant: "destructive",
        title: "Erro ao ler QR Code",
        description: "Formato inválido, tente novamente ou insira o código manualmente",
      });
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
        <Scanner
          onResult={(result) => handleScan(result.getText())}
          onError={(error) => {
            console.error("Scanner error:", error);
            setHasError(true);
            toast({
              variant: "destructive",
              title: "Erro no scanner",
              description: "Não foi possível acessar a câmera",
            });
          }}
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
