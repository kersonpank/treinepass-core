import { useToast } from "@/hooks/use-toast";
import { Scanner } from "@yudiel/react-qr-scanner";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
}

export function QRCodeScanner({ onScan }: QRCodeScannerProps) {
  const { toast } = useToast();

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
    <div className="py-2">
      <Scanner
        onResult={handleScan}
        onError={handleError}
        className="w-full aspect-square"
      />
      <p className="text-sm text-center text-muted-foreground mt-2">
        Aponte a câmera para o QR Code da academia
      </p>
    </div>
  );
}
