import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

interface PixInfoProps {
  qrCode?: string; // base64 image
  code?: string;
  value: number;
  onCopy?: () => void;
}

export function PixInfo({ qrCode, code, value, onCopy }: PixInfoProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {qrCode && (
        <div className="bg-white p-4 rounded-lg">
          <img src={qrCode} alt="QR Code PIX" className="w-48 h-48" />
        </div>
      )}
      {code && (
        <div className="flex items-center space-x-2 w-full">
          <input
            type="text"
            value={code}
            readOnly
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          />
          <Button variant="outline" size="icon" onClick={onCopy} title="Copiar código PIX">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}
      <p className="text-sm text-muted-foreground text-center">
        Após o pagamento, seu plano será ativado automaticamente.<br />
        Este processo pode levar alguns minutos.
      </p>
    </div>
  );
}
