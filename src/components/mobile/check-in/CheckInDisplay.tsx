import { Card, CardContent } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { CheckInCode } from "@/types/check-in";
import { CheckInStatus } from "./CheckInStatus";

interface CheckInDisplayProps {
  checkInCode: CheckInCode;
  onExpire: () => void;
}

export function CheckInDisplay({ checkInCode, onExpire }: CheckInDisplayProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="space-y-4 p-6">
        <div className="flex justify-center">
          <QRCodeSVG
            value={JSON.stringify(checkInCode.qr_data)}
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