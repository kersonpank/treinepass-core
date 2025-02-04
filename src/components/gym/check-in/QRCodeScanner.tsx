import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent } from "@/components/ui/card";

interface QRCodeScannerProps {
  onResult: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRCodeScanner({ onResult, onError }: QRCodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const qrScanner = new Html5Qrcode("qr-reader");
    scannerRef.current = qrScanner;

    qrScanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onResult(decodedText);
        },
        (errorMessage) => {
          console.error("QR Code scanning error:", errorMessage);
          onError?.(errorMessage);
        }
      )
      .catch((err) => {
        console.error("Error starting QR Code scanner:", err);
        onError?.(err.message || "Erro ao iniciar o scanner");
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error stopping QR Code scanner:", err));
      }
    };
  }, [onResult, onError]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div id="qr-reader" className="w-full max-w-sm mx-auto" />
      </CardContent>
    </Card>
  );
}
