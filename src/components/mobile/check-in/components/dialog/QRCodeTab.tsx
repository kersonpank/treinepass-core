
import { QRCodeScanner } from "../QRCodeScanner";

interface QRCodeTabProps {
  onScan: (result: string) => void;
}

export function QRCodeTab({ onScan }: QRCodeTabProps) {
  return (
    <div className="mt-4">
      <QRCodeScanner onScan={onScan} />
    </div>
  );
}
