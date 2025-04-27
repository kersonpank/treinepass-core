import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
}

export function QRCodeScanner({ onScan }: QRCodeScannerProps) {
  const { toast } = useToast();
  const [scannerAvailable, setScannerAvailable] = useState(true);

  const handleScan = (result: string) => {
    if (result) {
      console.log("QR code scanned:", result);
      onScan(result);
    }
  };

  const handleError = (error: any) => {
    console.error("Scanner error:", error);
    setScannerAvailable(false);
    toast({
      variant: "destructive",
      title: "Scanner error",
      description: "Could not access camera",
    });
  };

  // Render scanner with fallback
  const renderScanner = () => {
    return scannerAvailable ? (
      <Scanner
        onScan={handleScan}
        onError={handleError}
        videoConstraints={{ facingMode: { exact: "environment" } }}
        className="w-full aspect-square"
      />
    ) : (
      <div className="text-center text-muted-foreground">
        Câmera não disponível
      </div>
    );
  };

  return (
    <div className="py-2">
      {renderScanner()}
      <p className="text-sm text-center text-muted-foreground mt-2">
        Point the camera at the gym's QR Code
      </p>
    </div>
  );
}
