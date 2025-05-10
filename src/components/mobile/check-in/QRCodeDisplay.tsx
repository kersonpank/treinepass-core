
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckInCode } from "@/types/check-in";

interface QRCodeDisplayProps {
  checkInCode: CheckInCode;
  timeLeft: number;
}

export function QRCodeDisplay({ checkInCode, timeLeft }: QRCodeDisplayProps) {
  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Create QR code data object
  const qrData = JSON.stringify({
    code: checkInCode.code,
    academia_id: checkInCode.academia_id
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="space-y-4 p-6">
        <div className="flex justify-center">
          <QRCodeSVG
            value={qrData}
            size={200}
            level="H"
            includeMargin
            className="border-8 border-white rounded-lg shadow-lg"
          />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Código: {checkInCode.code}</p>
          <p className="text-sm text-muted-foreground">
            Apresente este QR Code ou informe o código acima
          </p>
          <p className="text-sm font-medium">
            Expira em: {formatTimeLeft(timeLeft)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
