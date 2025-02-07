
import { useToast } from "@/hooks/use-toast";
import { Scanner } from "@yudiel/react-qr-scanner";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
}

export function QRCodeScanner({ onScan }: QRCodeScannerProps) {
  const { toast } = useToast();

  return (
    <div className="py-2">
      <Scanner
        onResult={(result) => onScan(result)}
        onError={(error) => {
          console.error(error);
          toast({
            variant: "destructive",
            title: "Erro no scanner",
            description: "Não foi possível acessar a câmera",
          });
        }}
      />
      <p className="text-sm text-center text-muted-foreground mt-2">
        Aponte a câmera para o QR Code da academia
      </p>
    </div>
  );
}
