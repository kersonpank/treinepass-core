
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface PixInfoProps {
  qrCode?: string;
  code?: string;
  value: number;
  onCopy?: () => void;
}

export function PixInfo({ qrCode, code, value, onCopy }: PixInfoProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      if (onCopy) {
        onCopy();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-center mb-2">
        <p className="font-medium">PIX - R$ {value?.toFixed(2).replace('.', ',')}</p>
        <p className="text-sm text-muted-foreground">
          Escaneie o QR Code ou copie e cole o código no seu aplicativo de banco
        </p>
      </div>
      
      {qrCode ? (
        <div className="border border-border p-2 rounded-md bg-white">
          <img
            src={`data:image/png;base64,${qrCode}`}
            alt="QR Code PIX"
            className="w-60 h-60 object-contain"
          />
        </div>
      ) : (
        <div className="w-60 h-60 bg-muted flex items-center justify-center rounded-md">
          <p className="text-sm text-muted-foreground">QR Code não disponível</p>
        </div>
      )}
      
      {code && (
        <div className="w-full relative">
          <div className="p-3 bg-muted rounded-md text-xs overflow-x-auto whitespace-nowrap">
            {code}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
      )}
      
      <p className="text-sm text-muted-foreground text-center mt-2">
        Após o pagamento, sua conta será ativada automaticamente.
      </p>
    </div>
  );
}
