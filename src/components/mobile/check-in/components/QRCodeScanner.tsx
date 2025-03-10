
import { useToast } from "@/hooks/use-toast";
import { Scanner } from "@yudiel/react-qr-scanner";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
}

export function QRCodeScanner({ onScan }: QRCodeScannerProps) {
  const { toast } = useToast();

  const handleScan = (result: string) => {
    if (result) {
      onScan(result);
    }
  };

  const handleError = (error: any) => {
    console.error("Scanner error:", error);
    toast({
      variant: "destructive",
      title: "Scanner error",
      description: "Could not access camera",
    });
  };

  return (
    <div className="py-2">
      <Scanner
        onScan={handleScan}
        onError={handleError}
        className="w-full aspect-square"
      />
      <p className="text-sm text-center text-muted-foreground mt-2">
        Point the camera at the gym's QR Code
      </p>
    </div>
  );
}
