
import { Card, CardContent } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { CheckInCode } from "@/types/check-in";
import { CheckInStatus } from "./CheckInStatus";

interface CheckInDisplayProps {
  checkInCode: CheckInCode;
  onExpire: () => void;
}

export function CheckInDisplay({ checkInCode, onExpire }: CheckInDisplayProps) {
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
        <CheckInStatus checkInCode={checkInCode} onExpire={onExpire} />
      </CardContent>
    </Card>
  );
}
